// Translates Taobao listing copy (Chinese) into Mongolian with Claude.
// Server-only: imports the Anthropic SDK and reads ANTHROPIC_API_KEY.

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { sampleTranslation } from './sampleProvider';
import type { TaobaoTranslation } from './types';
import type { TranslateRequestItem } from './validate';

const MODEL = 'claude-opus-5-5';

const Translation = z.object({
  items: z.array(
    z.object({
      itemId: z.string(),
      name: z.string(),
      description: z.string(),
      details: z.array(z.string()),
      variants: z.array(z.string()),
    })
  ),
});

const SYSTEM = `Та Монголын онлайн дэлгүүрт зориулж Taobao-ийн ор дэрний бараа (цагаан хэрэглэл, хөнжил, дэр, халад, алчуур)-ны хятад мэдээллийг монгол хэл рүү орчуулна.

Бараа бүрд:
- name: худалдан авагчид ойлгомжтой, байгалийн монгол нэр. 80 тэмдэгтээс хэтрэхгүй. Хятад гарчигт түлхүүр үг давтаж чихсэн байдаг тул үгчлэн буулгахгүй: юу болох, гол материал, хэмжээ эсвэл ширхгийн тоог л үлдээнэ.
- description: нэг өгүүлбэр товч тайлбар, 180 тэмдэгтээс хэтрэхгүй.
- details: attrsZh-ийн мөр бүрийг "Шинж: утга" хэлбэрээр орчуулна. Мөр бүр 160 тэмдэгтээс хэтрэхгүй, дээд тал нь 8 мөр.
- variants: skusZh-ийн сонголт бүрийг ижил дарааллаар орчуулна.

Дүрэм:
- Эх мэдээлэлд байхгүй шинж чанар, амлалт, чанарын магтаал нэмэхгүй. Эх мэдээллийн "хамгийн", "100%" зэрэг зар сурталчилгааны хэтрүүлгийг баримт биш бол орхино; материалын хувь зэрэг тодорхой үзүүлэлтийг хэвээр үлдээнэ.
- Хэмжээг "200×230 см" хэлбэрээр, жинг грамм эсвэл килограммаар бичнэ (1 斤 = 0.5 кг).
- Дэлгүүрийн нэр, брэндийг орчуулгад оруулахгүй.
- itemId-г өөрчлөхгүйгээр буцаана. Оролтын бараа бүрд яг нэг гаралт өгнө.`;

export type TranslatorId = 'claude' | 'sample';

export function translatorStatus(): { id: TranslatorId; label: string } {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  return configured ? { id: 'claude', label: 'Claude' } : { id: 'sample', label: 'Жишиг орчуулга' };
}

/** A failure with a message that is safe to show the admin. */
export class TranslateError extends Error {}

const clip = (value: string, max: number) => value.trim().slice(0, max);

export function normalizeTranslation(entry: TaobaoTranslation): TaobaoTranslation {
  return {
    itemId: entry.itemId,
    name: clip(entry.name, 80),
    description: clip(entry.description, 180),
    details: entry.details.map((line) => clip(line, 160)).filter(Boolean).slice(0, 8),
    variants: entry.variants.map((line) => clip(line, 60)).filter(Boolean).slice(0, 20),
  };
}

async function translateWithClaude(items: TranslateRequestItem[]): Promise<TaobaoTranslation[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // If a safety classifier declines the request, the API retries on a fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [
      { role: 'user', content: `Дараах бараануудыг орчуулна уу:\n\n${JSON.stringify(items, null, 2)}` },
    ],
    output_config: { effort: 'low', format: betaZodOutputFormat(Translation) },
  });
  if (response.stop_reason === 'refusal') throw new TranslateError('Claude энэ хүсэлтийг орчуулахаас татгалзлаа.');
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new TranslateError('Орчуулга дутуу ирлээ. Дахин оролдоно уу.');
  }
  const translated = new Map(response.parsed_output.items.map((entry) => [entry.itemId, entry]));
  return items.map((source) => {
    const entry = translated.get(source.itemId);
    if (!entry) throw new TranslateError(`Орчуулга дутуу ирлээ: ${source.itemId}`);
    return normalizeTranslation(entry);
  });
}

export async function translateItems(
  items: TranslateRequestItem[]
): Promise<{ translator: TranslatorId; items: TaobaoTranslation[] }> {
  if (translatorStatus().id === 'sample') {
    return {
      translator: 'sample',
      items: items.map((source) => {
        const ready = sampleTranslation(source.itemId);
        if (!ready) throw new TranslateError('Энэ барааг орчуулахын тулд ANTHROPIC_API_KEY тохируулна уу.');
        return normalizeTranslation(ready);
      }),
    };
  }
  try {
    return { translator: 'claude', items: await translateWithClaude(items) };
  } catch (error) {
    if (error instanceof TranslateError) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new TranslateError('Claude API түлхүүр буруу байна.');
    if (error instanceof Anthropic.RateLimitError) throw new TranslateError('Claude API-ийн хязгаарт хүрлээ. Түр хүлээгээд дахин оролдоно уу.');
    if (error instanceof Anthropic.APIError) throw new TranslateError(`Claude API алдаа (${error.status ?? 'сүлжээ'}).`);
    throw error;
  }
}
