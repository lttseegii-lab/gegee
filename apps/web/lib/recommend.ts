// Rule-based AI recommender — scores products against a user's input
// across multiple dimensions (mood, recipient hint, budget, style).
// Phase 3 can swap this for Claude API / embedding-based search.

import type { Product } from '@/types/database';
import { MOODS_BY_KEY, type Mood } from './moods';

export interface RecommendInput {
  /** Optional free-text note: "Ээждээ, 150K дотор, төрсөн өдөр" */
  query?: string;
  mood?: string;
  budget?: number;
  /** Structured selections — keys from RECIPIENTS / OCCASIONS / ZODIAC / AGES. */
  recipient?: string;
  occasion?: string;
  zodiac?: string;
  age?: string;
}

export interface RecommendScore {
  product: Product;
  score: number;
  reasons: string[];
}

// ── Structured selection options for the guided "AI санал" wizard ──
// Each option maps to product tags the scorer already understands.
export interface RecommendOption {
  key: string;
  label: string;
  emoji: string;
  tags: string[];
  /** RECIPIENTS only — dative form used in the summary ("Ээждээ"). */
  dative?: string;
  /** OCCASIONS — phrase fragment used in the summary. */
  phrase?: string;
  /** ZODIAC — Mongolian "birth flower" name recommended for this sign. */
  flower?: string;
}

/** Хэнд — who the flowers are for. */
export const RECIPIENTS: RecommendOption[] = [
  { key: 'mom', label: 'Ээж', emoji: '🌷', dative: 'Ээждээ', tags: ['romance', 'peony', 'pink', 'elegant'] },
  { key: 'dad', label: 'Аав', emoji: '🌿', dative: 'Аавдаа', tags: ['hand-tied', 'sage', 'eucalyptus'] },
  { key: 'partner', label: 'Хайрт', emoji: '❤️', dative: 'Хайртдаа', tags: ['romance', 'peony', 'rose'] },
  { key: 'friend', label: 'Найз', emoji: '🎉', dative: 'Найздаа', tags: ['celebration', 'colorful', 'just-because'] },
  { key: 'sister', label: 'Эгч / дүү', emoji: '💐', dative: 'Эгч дүүдээ', tags: ['celebration', 'pink', 'bouquet'] },
  { key: 'colleague', label: 'Хамт олон', emoji: '🤝', dative: 'Хамт олондоо', tags: ['elegant', 'minimal', 'sage'] },
  { key: 'self', label: 'Өөртөө', emoji: '✨', dative: 'Өөртөө', tags: ['just-because', 'colorful'] },
];

/** Ямар үйл явдал — the occasion. */
export const OCCASIONS: RecommendOption[] = [
  { key: 'birthday', label: 'Төрсөн өдөр', emoji: '🎂', phrase: 'төрсөн өдрийн баярт', tags: ['birthday', 'celebration', 'sunflower'] },
  { key: 'anniversary', label: 'Ой тэмдэглэл', emoji: '💍', phrase: 'ой тэмдэглэлд', tags: ['anniversary', 'romance', 'rose'] },
  { key: 'congrats', label: 'Баяр хүргэе', emoji: '🎊', phrase: 'баяр хүргэхэд', tags: ['celebration', 'colorful', 'sunflower'] },
  { key: 'love', label: 'Хайраа илэрхийлэх', emoji: '💕', phrase: 'хайраа илэрхийлэхэд', tags: ['romance', 'rose', 'peony'] },
  { key: 'thanks', label: 'Талархал', emoji: '🙏', phrase: 'талархлаа илэрхийлэхэд', tags: ['celebration', 'peach', 'yellow'] },
  { key: 'apology', label: 'Уучлал', emoji: '🥺', phrase: 'уучлал гуйхад', tags: ['apology', 'white', 'lily'] },
  { key: 'sympathy', label: 'Тайтгарал', emoji: '🕊️', phrase: 'тайтгаруулахад', tags: ['sympathy', 'lily', 'white', 'sage'] },
  { key: 'newhome', label: 'Шинэ гэр', emoji: '🏡', phrase: 'шинэ гэрийн баярт', tags: ['plant', 'houseplant', 'celebration'] },
  { key: 'justbecause', label: 'Зүгээр л', emoji: '🌼', phrase: '', tags: ['just-because', 'colorful'] },
];

/**
 * Орд — zodiac sign. Each maps to its "birth flower" + matching tags so the
 * AI can suggest a concrete bloom even to someone who knows nothing about
 * flowers (e.g. "Арслан ордны хүнд Наран цэцэг тохирно").
 */
export const ZODIAC: RecommendOption[] = [
  { key: 'aries', label: 'Хонь', emoji: '♈', flower: 'Цахилдаг', tags: ['tulip', 'red', 'celebration'] },
  { key: 'taurus', label: 'Үхэр', emoji: '♉', flower: 'Сарнай', tags: ['rose', 'pink', 'romance'] },
  { key: 'gemini', label: 'Ихэр', emoji: '♊', flower: 'Лаванда', tags: ['lavender', 'colorful', 'celebration'] },
  { key: 'cancer', label: 'Мэлхий', emoji: '♋', flower: 'Цагаан сарнай', tags: ['white', 'rose', 'lily'] },
  { key: 'leo', label: 'Арслан', emoji: '♌', flower: 'Наран цэцэг', tags: ['sunflower', 'yellow', 'celebration'] },
  { key: 'virgo', label: 'Охин', emoji: '♍', flower: 'Дэйзи', tags: ['daisy', 'white', 'elegant'] },
  { key: 'libra', label: 'Жинлүүр', emoji: '♎', flower: 'Сарнай', tags: ['rose', 'pink', 'elegant'] },
  { key: 'scorpio', label: 'Хилэнц', emoji: '♏', flower: 'Пион', tags: ['peony', 'red', 'romance'] },
  { key: 'sagittarius', label: 'Нумч', emoji: '♐', flower: 'Карнатин', tags: ['carnation', 'colorful', 'celebration'] },
  { key: 'capricorn', label: 'Матар', emoji: '♑', flower: 'Орхид', tags: ['elegant', 'premium', 'white'] },
  { key: 'aquarius', label: 'Хумх', emoji: '♒', flower: 'Орхид', tags: ['elegant', 'premium', 'lavender'] },
  { key: 'pisces', label: 'Загас', emoji: '♓', flower: 'Сараана', tags: ['lily', 'white', 'sage'] },
];

/** Нас — recipient age band; nudges style from playful → classic. */
export const AGES: RecommendOption[] = [
  { key: 'child', label: 'Хүүхэд', emoji: '🧒', tags: ['colorful', 'sunflower', 'celebration'] },
  { key: 'teen', label: 'Өсвөр', emoji: '🧑', tags: ['pink', 'colorful', 'celebration'] },
  { key: 'young', label: '18–25', emoji: '💫', tags: ['pink', 'peony', 'rose'] },
  { key: 'adult', label: '26–40', emoji: '🌷', tags: ['rose', 'peony', 'elegant'] },
  { key: 'mature', label: '41–60', emoji: '🌹', tags: ['elegant', 'lily', 'premium'] },
  { key: 'senior', label: '60+', emoji: '🕊️', tags: ['white', 'lily', 'elegant'] },
];

// Mongolian keyword → tag/feature hints
const KEYWORD_MAP: Array<{ patterns: string[]; tags: string[]; reason: string }> = [
  { patterns: ['ээж', 'ээждээ', 'mother', 'mom'], tags: ['romance', 'peony', 'pink', 'elegant'], reason: 'Ээж/ээжийн өдөр' },
  { patterns: ['аав', 'father', 'dad'], tags: ['hand-tied', 'sage', 'eucalyptus'], reason: 'Аав' },
  { patterns: ['хайрт', 'love', 'romance', 'romantic'], tags: ['romance', 'peony', 'rose'], reason: 'Хайрт' },
  { patterns: ['нөхөр', 'эхнэр', 'partner', 'spouse'], tags: ['romance', 'rose', 'anniversary'], reason: 'Гэр бүл' },
  { patterns: ['найз', 'friend'], tags: ['celebration', 'colorful', 'just-because'], reason: 'Найз' },
  { patterns: ['эгч', 'sister'], tags: ['celebration', 'pink', 'bouquet'], reason: 'Эгч/дүү' },
  { patterns: ['ажил', 'colleague', 'work'], tags: ['elegant', 'minimal', 'sage'], reason: 'Ажилтан' },
  { patterns: ['төрсөн өдөр', 'birthday'], tags: ['birthday', 'celebration', 'sunflower'], reason: 'Төрсөн өдөр' },
  { patterns: ['ой', 'anniversary'], tags: ['anniversary', 'romance', 'rose'], reason: 'Ой тэмдэглэл' },
  { patterns: ['тайтгарал', 'sympathy', 'эмгэнэл'], tags: ['sympathy', 'lily', 'white', 'sage'], reason: 'Тайтгарал' },
  { patterns: ['уучлал', 'apology', 'sorry'], tags: ['apology', 'white', 'lily'], reason: 'Уучлал' },
  { patterns: ['хуримлуулах', 'wedding', 'хурим'], tags: ['wedding', 'white', 'peony', 'elegant'], reason: 'Хурим' },
  { patterns: ['дулаан', 'warm'], tags: ['peach', 'yellow', 'sunflower', 'rose'], reason: 'Дулаан өнгө' },
  { patterns: ['сэрүүн', 'cool', 'cold'], tags: ['white', 'lily', 'sage', 'eucalyptus'], reason: 'Сэрүүн өнгө' },
  { patterns: ['ягаан', 'pink'], tags: ['pink', 'peony', 'rose'], reason: 'Ягаан' },
  { patterns: ['цагаан', 'white'], tags: ['white', 'lily', 'elegant'], reason: 'Цагаан' },
  { patterns: ['шар', 'yellow'], tags: ['yellow', 'sunflower', 'tulip'], reason: 'Шар' },
  { patterns: ['улаан', 'red'], tags: ['red', 'rose', 'romance'], reason: 'Улаан' },
  { patterns: ['ягтсан', 'dried', 'хатсан'], tags: ['dried', 'lavender', 'sage'], reason: 'Хатсан цэцэг' },
  { patterns: ['эрхэмсэг', 'elegant'], tags: ['elegant', 'premium', 'luxury'], reason: 'Эрхэмсэг' },
  { patterns: ['тансаг', 'luxury', 'premium'], tags: ['premium', 'luxury'], reason: 'Тансаг' },
  { patterns: ['жижиг', 'small', 'mini'], tags: ['letterbox', 'small'], reason: 'Жижиг хэлбэр' },
  { patterns: ['том', 'big', 'large'], tags: ['premium', 'hand-tied'], reason: 'Том хэлбэр' },
  { patterns: ['ургамал', 'plant'], tags: ['plant', 'houseplant'], reason: 'Ургамал' },
  { patterns: ['тэжээвэр', 'pet'], tags: ['pet-safe'], reason: 'Pet-safe' },
];

function parseBudget(query: string): number | null {
  // "150,000₮", "150к", "150 мянга", "100k"
  const match =
    query.match(/(\d{1,3}(?:[,.\s]?\d{3})+)\s*₮?/i) ||
    query.match(/(\d+)\s*к/i) ||
    query.match(/(\d+)\s*k/i) ||
    query.match(/(\d+)\s*мянга/i);
  if (!match) return null;
  let n = parseInt(match[1].replace(/[,.\s]/g, ''), 10);
  if (isNaN(n)) return null;
  // If user wrote "150k" or "150 мянга", interpret as thousands
  if (/[кk]/i.test(match[0]) || /мянга/.test(match[0])) {
    n = n * 1000;
  }
  // Heuristic: any "150" alone in a sentence almost certainly means 150K
  if (n < 1000 && /\d/.test(query)) {
    n = n * 1000;
  }
  return n;
}

export function parseInput(input: RecommendInput): {
  tags: string[];
  reasons: string[];
  budget: number | null;
  mood: Mood | null;
} {
  const q = (input.query ?? '').toLowerCase();
  const tags = new Set<string>();
  const reasons: string[] = [];

  // Mood-derived tags
  const mood = input.mood ? MOODS_BY_KEY[input.mood] : null;
  if (mood) {
    mood.tags.forEach((t) => tags.add(t));
    reasons.push(`${mood.label} мэдрэмж`);
  }

  // Structured selections (recipient / occasion / zodiac / age) → tags
  const selected: Array<RecommendOption | undefined> = [
    RECIPIENTS.find((o) => o.key === input.recipient),
    OCCASIONS.find((o) => o.key === input.occasion),
    ZODIAC.find((o) => o.key === input.zodiac),
    AGES.find((o) => o.key === input.age),
  ];
  for (const opt of selected) {
    if (!opt) continue;
    opt.tags.forEach((t) => tags.add(t));
    if (!reasons.includes(opt.label)) reasons.push(opt.label);
  }

  // Keyword scan
  for (const entry of KEYWORD_MAP) {
    for (const p of entry.patterns) {
      if (q.includes(p)) {
        entry.tags.forEach((t) => tags.add(t));
        if (!reasons.includes(entry.reason)) reasons.push(entry.reason);
        break;
      }
    }
  }

  const budget = input.budget ?? parseBudget(input.query ?? '');

  return { tags: Array.from(tags), reasons, budget, mood };
}

export function scoreProducts(
  products: Product[],
  input: RecommendInput
): RecommendScore[] {
  const { tags, budget, mood } = parseInput(input);

  return products
    .filter((p) => p.active !== false)
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];
      const pTags = p.tags ?? [];
      const pOcc = p.occasion ?? [];

      // +5 per matching tag
      for (const t of tags) {
        if (pTags.includes(t) || pOcc.includes(t)) score += 5;
      }

      // Budget proximity bonus (within 50% of stated budget → +3)
      if (budget != null) {
        if (p.price <= budget) score += 4;
        if (p.price > budget) score -= 6;
        // Sweet spot — within ±25% of budget
        const diff = Math.abs(p.price - budget) / budget;
        if (diff < 0.25) {
          score += 5;
          reasons.push('Төсөвт яг таарсан');
        }
      }

      // Quality signals
      score += Math.min(3, Math.floor((p.reviews ?? 0) / 1000));
      if ((p.rating ?? 0) >= 4.8) score += 2;

      // Badge bonus
      if (p.badge === 'top-pick') score += 2;

      return { product: p, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Friendly, AI-Concierge-style headline composed from the structured
 * selections — e.g. "Ээждээ төрсөн өдрийн баярт дулаан өнгийн баглаа онцгой
 * таарна." Degrades gracefully when some fields are not chosen.
 */
const OCCASION_FLOWER: Record<string, string> = {
  birthday: 'Наран цэцэг',
  anniversary: 'Улаан сарнай',
  congrats: 'Өнгөлөг баглаа',
  love: 'Улаан сарнай',
  thanks: 'Шар сарнай',
  apology: 'Цагаан сараана',
  sympathy: 'Цагаан сараана',
  newhome: 'Ногоон ургамал',
  justbecause: 'Улирлын баглаа',
};

export function buildRecommendSummary(
  input: Pick<RecommendInput, 'recipient' | 'occasion' | 'zodiac' | 'age'>,
  count: number
): string {
  const r = RECIPIENTS.find((o) => o.key === input.recipient);
  const o = OCCASIONS.find((o) => o.key === input.occasion);
  const z = ZODIAC.find((o) => o.key === input.zodiac);

  const who = r?.dative ?? 'Танд';
  const occ = o?.phrase ? `${o.phrase} ` : '';
  // Always name a concrete flower — zodiac birth-flower first, else an
  // occasion default — so a flower-novice gets a clear "pick this" tip.
  const flower =
    z?.flower ??
    (input.occasion ? OCCASION_FLOWER[input.occasion] : undefined) ??
    'Сарнай';
  const zodiacNote = z ? ` (${z.label} ордны хүнд онцгой тохирдог)` : '';

  return `${who} ${occ}${flower} сонгож үзвэл таарна${zodiacNote}. Доорх ${count} баглааг санал болголоо 🌸`;
}
