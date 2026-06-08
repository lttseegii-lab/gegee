// DIY flower catalog — hardcoded for MVP.
// Each flower has price per stem (₮) + AI prompt fragment.

export interface DiyFlower {
  key: string;
  name: string;
  emoji: string;
  /** Price per stem in MNT */
  price: number;
  /** Adjective + noun used to compose the AI bouquet prompt */
  promptFragment: string;
  /** Hex color used for swatch + dust */
  color: string;
  /** Optional real photo (admin upload). Falls back to emoji + color. */
  image_url?: string;
}

export const DIY_FLOWERS: DiyFlower[] = [
  {
    key: 'peony',
    name: 'Пион',
    emoji: '🌸',
    price: 12000,
    promptFragment: 'pink peonies',
    color: '#f5c6d0',
  },
  {
    key: 'rose',
    name: 'Сарнай',
    emoji: '🌹',
    price: 8000,
    promptFragment: 'red garden roses',
    color: '#d34a52',
  },
  {
    key: 'white-rose',
    name: 'Цагаан сарнай',
    emoji: '🤍',
    price: 8000,
    promptFragment: 'white garden roses',
    color: '#fafafa',
  },
  {
    key: 'tulip',
    name: 'Цахилдаг',
    emoji: '🌷',
    price: 5000,
    promptFragment: 'yellow tulips',
    color: '#f4d35e',
  },
  {
    key: 'sunflower',
    name: 'Наран цэцэг',
    emoji: '🌻',
    price: 7000,
    promptFragment: 'sunflowers',
    color: '#f7c43c',
  },
  {
    key: 'lily',
    name: 'Сараана',
    emoji: '🪻',
    price: 9000,
    promptFragment: 'white calla lilies',
    color: '#e8e2c8',
  },
  {
    key: 'eucalyptus',
    name: 'Эвкалипт',
    emoji: '🌿',
    price: 3000,
    promptFragment: 'eucalyptus greenery',
    color: '#a4b89e',
  },
  {
    key: 'lavender',
    name: 'Лаванда',
    emoji: '💜',
    price: 4000,
    promptFragment: 'lavender stems',
    color: '#b389d0',
  },
  {
    key: 'baby-breath',
    name: 'Хүүхдийн амьсгал',
    emoji: '✨',
    price: 2500,
    promptFragment: 'baby breath',
    color: '#fefefe',
  },
  {
    key: 'ranunculus',
    name: 'Ранункулус',
    emoji: '🌼',
    price: 9000,
    promptFragment: 'peach ranunculus',
    color: '#f4b690',
  },
  {
    key: 'anemone',
    name: 'Анемон',
    emoji: '🖤',
    price: 11000,
    promptFragment: 'burgundy anemones',
    color: '#4a1f2a',
  },
  {
    key: 'carnation',
    name: 'Карнатин',
    emoji: '🌺',
    price: 4000,
    promptFragment: 'soft pink carnations',
    color: '#e6a3b1',
  },
];

export const DIY_FLOWERS_BY_KEY: Record<string, DiyFlower> = Object.fromEntries(
  DIY_FLOWERS.map((f) => [f.key, f])
);

export interface FlowerSelection {
  key: string;
  qty: number;
}

export function flowerSubtotal(selections: FlowerSelection[]): number {
  return selections.reduce((sum, s) => {
    const f = DIY_FLOWERS_BY_KEY[s.key];
    return sum + (f ? f.price * s.qty : 0);
  }, 0);
}

export function totalStems(selections: FlowerSelection[]): number {
  return selections.reduce((sum, s) => sum + s.qty, 0);
}

/** Build a key→flower lookup from any flower list (admin-managed or default). */
export function diyFlowersByKey(
  flowers: DiyFlower[]
): Record<string, DiyFlower> {
  return Object.fromEntries(flowers.map((f) => [f.key, f]));
}

/**
 * Validate + normalize an admin-managed DIY flower list (stored as JSON in
 * site_settings.diy_flowers). Returns a clean list, or [] when the input is
 * unusable so callers can fall back to DIY_FLOWERS.
 */
export function sanitizeDiyFlowers(raw: unknown): DiyFlower[] {
  if (!Array.isArray(raw)) return [];
  const out: DiyFlower[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key.trim().slice(0, 40) : '';
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 40) : '';
    if (!key || !name || seen.has(key)) continue;
    seen.add(key);
    const price =
      typeof o.price === 'number' && Number.isFinite(o.price)
        ? Math.max(0, Math.min(1_000_000, Math.round(o.price)))
        : 0;
    const emoji =
      typeof o.emoji === 'string' && o.emoji.trim()
        ? o.emoji.trim().slice(0, 8)
        : '🌸';
    const color =
      typeof o.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(o.color.trim())
        ? o.color.trim()
        : '#f5c6d0';
    const promptFragment =
      typeof o.promptFragment === 'string'
        ? o.promptFragment.trim().slice(0, 100)
        : name;
    const imgRaw = typeof o.image_url === 'string' ? o.image_url.trim() : '';
    const image_url =
      imgRaw && (imgRaw.startsWith('http://') || imgRaw.startsWith('https://'))
        ? imgRaw.slice(0, 500)
        : undefined;
    out.push({ key, name, emoji, price, promptFragment, color, image_url });
  }
  return out;
}
