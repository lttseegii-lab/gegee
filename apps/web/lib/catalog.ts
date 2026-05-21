// Catalog configuration — filter chip definitions per category
// Ported from the prototype's catalogConfig (index.html ~line 10844)

export type CategoryKey = 'all' | 'flowers' | 'plants' | 'gifts' | 'cards' | 'subs';

export interface FilterDef {
  key: string;
  label: string;
  tags?: string[];
  pet_safe?: boolean;
  priceMin?: number;
  priceMax?: number;
}

export interface CategoryConfig {
  title: string;
  description?: string;
  /** Tags that limit the base product set for this category */
  baseTags: string[] | null;
  /** Chip definitions — '__div__' string acts as visual separator */
  filters: (FilterDef | '__div__')[];
}

export const CATALOG_CONFIG: Record<CategoryKey, CategoryConfig> = {
  all: {
    title: 'Бүх бүтээгдэхүүн',
    baseTags: null,
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'flowers', label: 'Цэцэг', tags: ['flowers', 'цэцэг'] },
      { key: 'plants', label: 'Ургамал', tags: ['plant', 'таримал'] },
      { key: 'gifts', label: 'Бэлэг', tags: ['бэлэг', 'hamper', 'gift-set'] },
      { key: 'cards', label: 'Карт', tags: ['card', 'карт'] },
      { key: 'subs', label: 'Захиалга', tags: ['subscription', 'захиалга'] },
      '__div__',
      { key: 'pet-safe', label: '🐾 Pet-safe', pet_safe: true },
      { key: 'new', label: 'Шинэ', tags: ['new'] },
    ],
  },
  flowers: {
    title: 'Цэцэг',
    description: 'Гар утаст баглаанаас letterbox-д хүртэл',
    baseTags: [
      'flowers',
      'цэцэг',
      'peony',
      'tulip',
      'sunflower',
      'rose',
      'lavender',
      'lily',
    ],
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'letterbox', label: 'Letterbox', tags: ['letterbox'] },
      { key: 'hand-tied', label: 'Гар утаст', tags: ['hand-tied', 'bouquet'] },
      { key: 'premium', label: 'Тансаг', tags: ['premium', 'luxury'] },
      { key: 'dried', label: 'Хатсан', tags: ['dried', 'lavender'] },
      '__div__',
      { key: 'p-low', label: '80K хүртэл', priceMax: 80000 },
      { key: 'p-mid', label: '80–150K', priceMin: 80000, priceMax: 150000 },
      { key: 'p-high', label: '150K+', priceMin: 150000 },
      '__div__',
      { key: 'pet-safe', label: '🐾 Pet-safe', pet_safe: true },
      { key: 'new', label: 'Шинэ', tags: ['new'] },
    ],
  },
  plants: {
    title: 'Ургамал',
    description: 'House plants, орхид, суккулент',
    baseTags: ['plant', 'таримал', 'houseplant', 'orchid', 'succulent'],
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'houseplant', label: 'House plant', tags: ['houseplant'] },
      { key: 'orchid', label: 'Орхид', tags: ['orchid'] },
      { key: 'succulent', label: 'Суккулент', tags: ['succulent'] },
      '__div__',
      { key: 'pet-safe', label: '🐾 Pet-safe', pet_safe: true },
      { key: 'p-low', label: '80K хүртэл', priceMax: 80000 },
    ],
  },
  gifts: {
    title: 'Бэлэг',
    description: 'Hamper, шоколад, дарс болон бэлгийн сэт',
    baseTags: ['бэлэг', 'hamper', 'gift-set', 'tea', 'chocolate', 'wine'],
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'hamper', label: 'Hamper', tags: ['hamper'] },
      { key: 'chocolate', label: 'Шоколад', tags: ['chocolate'] },
      { key: 'wine', label: 'Дарс', tags: ['wine'] },
      { key: 'tea', label: 'Цай', tags: ['tea'] },
      '__div__',
      { key: 'p-high', label: '150K+', priceMin: 150000 },
    ],
  },
  cards: {
    title: 'Карт',
    description: 'Greeting card, AI захидал',
    baseTags: ['card', 'карт', 'greeting'],
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'birthday', label: 'Төрсөн өдөр', tags: ['birthday'] },
      { key: 'thanks', label: 'Талархал', tags: ['thanks'] },
      { key: 'sympathy', label: 'Тайтгарал', tags: ['sympathy'] },
    ],
  },
  subs: {
    title: 'Захиалгат хүргэлт',
    description: 'Долоо хоног, сар тутмын цэцэг',
    baseTags: ['subscription', 'захиалга', 'weekly', 'monthly'],
    filters: [
      { key: 'all', label: 'Бүгд' },
      '__div__',
      { key: 'weekly', label: '7 хоног тутам', tags: ['weekly'] },
      { key: 'monthly', label: 'Сар тутам', tags: ['monthly'] },
      { key: 'premium', label: 'Premium', tags: ['premium', 'signature'] },
    ],
  },
};

export type SortKey = 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'new';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Алдартай' },
  { value: 'rating', label: 'Рейтинг' },
  { value: 'price-asc', label: 'Үнэ ↑' },
  { value: 'price-desc', label: 'Үнэ ↓' },
  { value: 'new', label: 'Шинэ эхэндээ' },
];

import type { Product } from '@/types/database';

export function matchesFilter(p: Product, f: FilterDef): boolean {
  if (f.key === 'all') return true;
  if (f.pet_safe && !p.pet_safe) return false;
  if (f.priceMin != null && p.price < f.priceMin) return false;
  if (f.priceMax != null && p.price > f.priceMax) return false;
  if (f.tags && f.tags.length > 0) {
    const tags = p.tags ?? [];
    return f.tags.some((t) => tags.includes(t));
  }
  return true;
}

export function sortProducts(products: Product[], sortBy: SortKey): Product[] {
  const arr = [...products];
  switch (sortBy) {
    case 'rating':
      return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price);
    case 'new': {
      const newFirst = arr.filter((p) => (p.tags ?? []).includes('new'));
      const rest = arr.filter((p) => !(p.tags ?? []).includes('new'));
      return [...newFirst, ...rest];
    }
    case 'popular':
    default:
      return arr.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
  }
}
