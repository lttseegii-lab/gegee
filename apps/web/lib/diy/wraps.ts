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
