// Rule-based AI recommender — scores products against a user's input
// across multiple dimensions (mood, recipient hint, budget, style).
// Phase 3 can swap this for Claude API / embedding-based search.

import type { Product } from '@/types/database';
import { MOODS_BY_KEY, type Mood } from './moods';

export interface RecommendInput {
  /** Natural language: "Ээждээ, 150K дотор, дулаан өнгөтэй" */
  query: string;
  mood?: string;
  budget?: number;
  recipient?: 'mom' | 'partner' | 'friend' | 'colleague' | 'self' | string;
}

export interface RecommendScore {
  product: Product;
  score: number;
  reasons: string[];
}

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
  const q = input.query.toLowerCase();
  const tags = new Set<string>();
  const reasons: string[] = [];

  // Mood-derived tags
  const mood = input.mood ? MOODS_BY_KEY[input.mood] : null;
  if (mood) {
    mood.tags.forEach((t) => tags.add(t));
    reasons.push(`${mood.label} мэдрэмж`);
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

  const budget = input.budget ?? parseBudget(input.query);

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
