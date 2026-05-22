// Memory Garden — occasion definitions + AI suggestion mapping
//
// For each occasion key, we know:
// - Human-readable label (Mongolian)
// - Icon emoji
// - Default suggested product (matched by tags in productCatalog)
// - Tone of voice for AI reminder messages
//
// The AI suggestion mapping is keyword-based for MVP. Phase 3 can swap to
// real ML-based recommendation using order history + recipient profile.

export const OCCASIONS = {
  birthday: {
    label: 'Төрсөн өдөр',
    icon: '🎂',
    productTags: ['birthday', 'bouquet', 'romance'],
    tone: 'joyful',
  },
  anniversary: {
    label: 'Ой тэмдэглэл',
    icon: '💝',
    productTags: ['anniversary', 'romance', 'peony', 'rose'],
    tone: 'romantic',
  },
  mothers_day: {
    label: 'Ээжийн өдөр',
    icon: '💐',
    productTags: ['romance', 'peony', 'pink', 'hand-tied'],
    tone: 'tender',
  },
  fathers_day: {
    label: 'Аавын өдөр',
    icon: '🌿',
    productTags: ['hand-tied', 'sage', 'eucalyptus'],
    tone: 'tender',
  },
  graduation: {
    label: 'Төгсөлт',
    icon: '🎓',
    productTags: ['celebration', 'sunflower', 'bestseller'],
    tone: 'celebration',
  },
  just_because: {
    label: 'Зүгээр л',
    icon: '🌸',
    productTags: ['just-because', 'letterbox', 'bouquet'],
    tone: 'playful',
  },
  memorial: {
    label: 'Дурсамж',
    icon: '🕊️',
    productTags: ['sympathy', 'calm', 'lily', 'sage'],
    tone: 'gentle',
  },
  other: {
    label: 'Бусад',
    icon: '✻',
    productTags: ['bouquet'],
    tone: 'neutral',
  },
} as const;

export type OccasionKey = keyof typeof OCCASIONS;

export const OCCASION_KEYS = Object.keys(OCCASIONS) as OccasionKey[];

/**
 * Match an occasion against the product catalog to find the best fit.
 * Returns the product_id of the highest-scoring candidate.
 * (Score = number of overlapping tags.)
 */
export function suggestProductForOccasion(
  occasion: OccasionKey,
  candidates: Array<{ id: string; tags: string[] | null; price: number; reviews: number | null }>
): string | null {
  const wanted = OCCASIONS[occasion]?.productTags ?? [];
  if (!candidates.length) return null;

  let best: { id: string; score: number; reviews: number } | null = null;
  for (const c of candidates) {
    const tags = c.tags ?? [];
    const score = wanted.filter((w) => tags.includes(w)).length;
    if (score === 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && (c.reviews ?? 0) > best.reviews)
    ) {
      best = { id: c.id, score, reviews: c.reviews ?? 0 };
    }
  }
  return best?.id ?? null;
}

/** Format month+day as "May 17" */
export function formatMonthDay(
  month: number,
  day: number,
  locale: string = 'mn-MN'
): string {
  // Use a fixed year so formatting is consistent
  const d = new Date(2024, month - 1, day);
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}
