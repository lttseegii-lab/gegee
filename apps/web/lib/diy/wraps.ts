// DIY wrap options — hardcoded.

export interface DiyWrap {
  key: string;
  name: string;
  description: string;
  /** Wrap price in MNT */
  price: number;
  /** AI prompt fragment used when generating the bouquet image */
  promptFragment: string;
  /** Emoji + bg gradient for selection card */
  emoji: string;
  bgClass: string;
}

export const DIY_WRAPS: DiyWrap[] = [
  {
    key: 'kraft',
    name: 'Kraft цаас',
    description: 'Eco-friendly, natural look',
    price: 5000,
    promptFragment: 'wrapped in kraft paper with twine',
    emoji: '📜',
    bgClass: 'bg-gradient-to-br from-peach to-yellow-pale',
  },
  {
    key: 'linen',
    name: 'Linen даавуу',
    description: 'Soft, hand-tied, эрхэмсэг',
    price: 8000,
    promptFragment: 'wrapped in soft linen fabric',
    emoji: '🧶',
    bgClass: 'bg-gradient-to-br from-offwhite to-mint',
  },
  {
    key: 'silk',
    name: 'Silk ribbon',
    description: 'Тансаг, premium finish',
    price: 15000,
    promptFragment: 'tied with luxury silk ribbon',
    emoji: '🎀',
    bgClass: 'bg-gradient-to-br from-blush to-purpleSoft',
  },
  {
    key: 'letterbox',
    name: 'Letterbox box',
    description: 'Үүдэнд хүрэх, post-friendly',
    price: 12000,
    promptFragment: 'arranged in a flat letterbox delivery box',
    emoji: '📦',
    bgClass: 'bg-gradient-to-br from-lilac to-blush',
  },
];

export const DIY_WRAPS_BY_KEY: Record<string, DiyWrap> = Object.fromEntries(
  DIY_WRAPS.map((w) => [w.key, w])
);

/** Preset wrap background gradients — kept static so Tailwind compiles them. */
export const DIY_WRAP_GRADIENTS: { label: string; bgClass: string }[] = [
  { label: 'Peach', bgClass: 'bg-gradient-to-br from-peach to-yellow-pale' },
  { label: 'Mint', bgClass: 'bg-gradient-to-br from-offwhite to-mint' },
  { label: 'Blush', bgClass: 'bg-gradient-to-br from-blush to-purpleSoft' },
  { label: 'Lilac', bgClass: 'bg-gradient-to-br from-lilac to-blush' },
  { label: 'Sage', bgClass: 'bg-gradient-to-br from-mint to-sageDeep/30' },
  { label: 'Rose', bgClass: 'bg-gradient-to-br from-pinkHot/20 to-blush' },
];

/** Build a key→wrap lookup from any wrap list (admin-managed or default). */
export function diyWrapsByKey(wraps: DiyWrap[]): Record<string, DiyWrap> {
  return Object.fromEntries(wraps.map((w) => [w.key, w]));
}

/**
 * Validate + normalize an admin-managed DIY wrap list (stored as JSON in
 * site_settings.diy_wraps). Returns a clean list, or [] when unusable so
 * callers can fall back to DIY_WRAPS.
 */
export function sanitizeDiyWraps(raw: unknown): DiyWrap[] {
  if (!Array.isArray(raw)) return [];
  const out: DiyWrap[] = [];
  const seen = new Set<string>();
  const presets = new Set(DIY_WRAP_GRADIENTS.map((g) => g.bgClass));
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key.trim().slice(0, 40) : '';
    const name = typeof o.name === 'string' ? o.name.trim().slice(0, 40) : '';
    if (!key || !name || seen.has(key)) continue;
    seen.add(key);
    const description =
      typeof o.description === 'string'
        ? o.description.trim().slice(0, 120)
        : '';
    const price =
      typeof o.price === 'number' && Number.isFinite(o.price)
        ? Math.max(0, Math.min(1_000_000, Math.round(o.price)))
        : 0;
    const promptFragment =
      typeof o.promptFragment === 'string'
        ? o.promptFragment.trim().slice(0, 100)
        : name;
    const emoji =
      typeof o.emoji === 'string' && o.emoji.trim()
        ? o.emoji.trim().slice(0, 8)
        : '🎀';
    // Constrain to a preset gradient so Tailwind always has the class compiled.
    const bgClass =
      typeof o.bgClass === 'string' && presets.has(o.bgClass.trim())
        ? o.bgClass.trim()
        : DIY_WRAP_GRADIENTS[0].bgClass;
    out.push({ key, name, description, price, promptFragment, emoji, bgClass });
  }
  return out;
}
