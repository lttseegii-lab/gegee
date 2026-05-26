// AI bouquet preview generation using Pollinations.ai.
//
// We build a prompt by concatenating selected flowers + wrap, then generate
// 3 variants by changing the style adjective + random seed.

import { aiImageUrl } from '@/lib/ai/pollinations';
import {
  DIY_FLOWERS_BY_KEY,
  type FlowerSelection,
} from './flowers';
import { DIY_WRAPS_BY_KEY } from './wraps';

export interface DiyVariant {
  /** Unique key for selection */
  key: string;
  /** Display name shown to user */
  styleName: string;
  /** Direct image URL from Pollinations */
  imageUrl: string;
  /** Seed used (for reproducibility — saved on order) */
  seed: number;
  /** Full prompt used (saved on order) */
  prompt: string;
}

/** Three style adjectives that give visually distinct variants */
const VARIANTS: { key: string; name: string; promptPrefix: string }[] = [
  {
    key: 'romantic',
    name: 'Хайрын зөөлөн',
    promptPrefix: 'romantic lush full hand-tied bouquet of',
  },
  {
    key: 'modern',
    name: 'Модерн минимал',
    promptPrefix: 'modern minimalist arrangement of',
  },
  {
    key: 'wild',
    name: 'Зэрлэг урлаг',
    promptPrefix: 'wildflower-style organic asymmetric bouquet of',
  },
];

function buildPrompt(
  selections: FlowerSelection[],
  wrapKey: string | null,
  prefix: string
): string {
  const flowerStr = selections
    .filter((s) => s.qty > 0)
    .map((s) => {
      const f = DIY_FLOWERS_BY_KEY[s.key];
      if (!f) return '';
      return `${s.qty} ${f.promptFragment}`;
    })
    .filter(Boolean)
    .join(', ');

  const wrap = wrapKey ? DIY_WRAPS_BY_KEY[wrapKey] : null;
  const wrapPart = wrap ? wrap.promptFragment : 'wrapped in kraft paper';

  return `${prefix} ${flowerStr}, ${wrapPart}, lifestyle photography, soft natural light, square composition, white background`;
}

/** Generate a deterministic seed from selections + variant index */
function seedFor(
  selections: FlowerSelection[],
  wrapKey: string | null,
  variantIdx: number
): number {
  // Simple stable hash so re-renders with same input give same image
  let h = variantIdx + 1;
  for (const s of selections) {
    for (let i = 0; i < s.key.length; i++) {
      h = (h * 31 + s.key.charCodeAt(i) + s.qty) & 0xffffffff;
    }
  }
  if (wrapKey) {
    for (let i = 0; i < wrapKey.length; i++) {
      h = (h * 31 + wrapKey.charCodeAt(i)) & 0xffffffff;
    }
  }
  return Math.abs(h) % 100000;
}

export function generateVariants(
  selections: FlowerSelection[],
  wrapKey: string | null
): DiyVariant[] {
  return VARIANTS.map((variant, i) => {
    const prompt = buildPrompt(selections, wrapKey, variant.promptPrefix);
    const seed = seedFor(selections, wrapKey, i);
    return {
      key: variant.key,
      styleName: variant.name,
      imageUrl: aiImageUrl(prompt, seed, 800, 800),
      seed,
      prompt,
    };
  });
}
