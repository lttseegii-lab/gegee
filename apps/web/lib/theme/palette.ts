// Curated color palette for admin theme customization.
//
// Each entry has:
// - key:            identifier stored in DB
// - label:          human-readable name
// - bgClass:        Tailwind background class (used by MegaMenu)
// - hoverClass:     Tailwind hover class for parent group (used by nav tab)
// - hex:            preview swatch color
//
// IMPORTANT: All bgClass / hoverClass strings MUST appear literally somewhere
// in the codebase so Tailwind JIT picks them up.
// They do, because this file is scanned by the JIT.

export interface ColorOption {
  key: string;
  label: string;
  bgClass: string;
  hoverClass: string; // group-hover variant
  hex: string;
}

export const COLOR_PALETTE: ColorOption[] = [
  { key: 'blush', label: 'Blush', bgClass: 'bg-blush', hoverClass: 'group-hover:bg-blush', hex: '#f5ebee' },
  { key: 'mint', label: 'Mint', bgClass: 'bg-mint', hoverClass: 'group-hover:bg-mint', hex: '#dde8dd' },
  { key: 'lilac', label: 'Lilac', bgClass: 'bg-lilac', hoverClass: 'group-hover:bg-lilac', hex: '#ece4ec' },
  { key: 'purpleSoft', label: 'Lavender', bgClass: 'bg-purpleSoft', hoverClass: 'group-hover:bg-purpleSoft', hex: '#ddd2e8' },
  { key: 'peach', label: 'Peach', bgClass: 'bg-peach', hoverClass: 'group-hover:bg-peach', hex: '#f5e8d4' },
  { key: 'yellow-pale', label: 'Cream', bgClass: 'bg-yellow-pale', hoverClass: 'group-hover:bg-yellow-pale', hex: '#fdf9d8' },
  { key: 'offwhite', label: 'Off-white', bgClass: 'bg-offwhite', hoverClass: 'group-hover:bg-offwhite', hex: '#fafafa' },
];

export const COLOR_BY_KEY: Record<string, ColorOption> = Object.fromEntries(
  COLOR_PALETTE.map((c) => [c.key, c])
);

export type CategoryKey = 'flowers' | 'plants' | 'gifts' | 'cards' | 'subs';

export type MenuColorMap = Record<CategoryKey, string>;

export const DEFAULT_MENU_COLORS: MenuColorMap = {
  flowers: 'blush',
  plants: 'mint',
  gifts: 'lilac',
  cards: 'purpleSoft',
  subs: 'peach',
};

export function resolveColor(key: string | undefined): ColorOption {
  if (key && COLOR_BY_KEY[key]) return COLOR_BY_KEY[key];
  return COLOR_BY_KEY.blush;
}

// ============================================================
// Hex-anywhere support — admin may pick any color, not just the
// 7 preset keys. Stored values are normalized via sanitizeColor().
// ============================================================

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(s: unknown): s is string {
  return typeof s === 'string' && HEX_RE.test(s.trim());
}

/**
 * Normalize a stored color value. Returns `#rrggbb` lowercase, or the preset
 * key untouched if it matches one of the COLOR_PALETTE entries. Anything
 * else falls back to the default `blush` preset.
 */
export function sanitizeColor(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_MENU_COLORS.flowers;
  const v = raw.trim();
  if (HEX_RE.test(v)) return v.toLowerCase();
  if (COLOR_BY_KEY[v]) return v;
  return DEFAULT_MENU_COLORS.flowers;
}

/**
 * Resolve any stored color value (preset key OR hex string) to its hex.
 * Used by header / mega menu rendering — we always render with inline
 * `style.backgroundColor` so arbitrary hex values work alongside presets.
 */
export function colorToHex(value: string | undefined): string {
  if (!value) return COLOR_BY_KEY.blush.hex;
  if (HEX_RE.test(value)) return value.toLowerCase();
  return COLOR_BY_KEY[value]?.hex ?? COLOR_BY_KEY.blush.hex;
}

// ============================================================
// Mega menu image cards — admin-configurable preview cards on
// the right side of the dropdown. Each category supports 0-2 cards.
// ============================================================

export interface MegaImageGradient {
  key: string;
  label: string;
  /** Full Tailwind background class — must appear literally in code */
  bgClass: string;
}

// All bgClass strings must appear literally here so Tailwind JIT picks them.
export const IMAGE_GRADIENTS: MegaImageGradient[] = [
  { key: 'pink-blush',     label: 'Pink → Blush',     bgClass: 'bg-gradient-to-br from-pinkHot/30 to-blush' },
  { key: 'lilac-purple',   label: 'Lilac → Lavender', bgClass: 'bg-gradient-to-br from-lilac to-purpleSoft' },
  { key: 'mint-sage',      label: 'Mint → Sage',      bgClass: 'bg-gradient-to-br from-mint to-sageDeep/30' },
  { key: 'mint-yellow',    label: 'Mint → Cream',     bgClass: 'bg-gradient-to-br from-mint/60 to-yellow/40' },
  { key: 'purple-lilac',   label: 'Lavender → Lilac', bgClass: 'bg-gradient-to-br from-purpleSoft to-lilac' },
  { key: 'purple-blush',   label: 'Lavender → Blush', bgClass: 'bg-gradient-to-br from-purpleSoft to-blush' },
  { key: 'peach-cream',    label: 'Peach → Cream',    bgClass: 'bg-gradient-to-br from-peach to-yellow-pale' },
  { key: 'cream-blush',    label: 'Cream → Blush',    bgClass: 'bg-gradient-to-br from-yellow-pale to-blush' },
  { key: 'lilac-soft',     label: 'Lilac soft',       bgClass: 'bg-gradient-to-br from-lilac to-purpleSoft/60' },
];

export const IMAGE_GRADIENT_BY_KEY: Record<string, MegaImageGradient> =
  Object.fromEntries(IMAGE_GRADIENTS.map((g) => [g.key, g]));

export function resolveGradient(key: string | undefined): MegaImageGradient {
  if (key && IMAGE_GRADIENT_BY_KEY[key]) return IMAGE_GRADIENT_BY_KEY[key];
  return IMAGE_GRADIENTS[0];
}

export interface MegaImageConfig {
  emoji: string;
  label: string;
  href: string;
  /** Gradient key from IMAGE_GRADIENTS (used as fallback / when image_url is empty) */
  gradient: string;
  /** Optional photo URL — if set, takes precedence over emoji + gradient */
  image_url?: string;
}

export type MenuImagesMap = Record<CategoryKey, MegaImageConfig[]>;

export const DEFAULT_MENU_IMAGES: MenuImagesMap = {
  flowers: [
    { emoji: '✉️', label: 'Letterbox цэцэг', href: '/catalog/flowers?filter=letterbox', gradient: 'pink-blush' },
    { emoji: '💐', label: 'Гар утаст баглаа', href: '/catalog/flowers?filter=hand-tied', gradient: 'lilac-purple' },
  ],
  plants: [
    { emoji: '🪴', label: 'House plant', href: '/catalog/plants?filter=houseplant', gradient: 'mint-sage' },
    { emoji: '🐾', label: 'Pet-safe', href: '/catalog/plants?filter=pet-safe', gradient: 'mint-yellow' },
  ],
  gifts: [
    { emoji: '🧺', label: 'Hamper', href: '/catalog/gifts?filter=hamper', gradient: 'lilac-soft' },
    { emoji: '🍫', label: 'Шоколад', href: '/catalog/gifts?filter=chocolate', gradient: 'purple-blush' },
  ],
  cards: [
    { emoji: '💌', label: 'Card цуглуулга', href: '/catalog/cards', gradient: 'purple-lilac' },
  ],
  subs: [
    { emoji: '📦', label: 'Signature Atelier', href: '/catalog/subs?filter=monthly', gradient: 'peach-cream' },
  ],
};


// ============================================================
// Mega menu sub-categories — admin-editable list of links shown
// in col 1 & 2 of each dropdown. Each subcategory has a `tag`
// that products opt into. Catalog page filters by tag.
// ============================================================

export interface MenuSubcategory {
  /** Stable id for React key + admin reference (slug-like) */
  key: string;
  /** Display label in Mongolian */
  label: string;
  /** Product tag this subcategory filters by. Used by /catalog as ?filter=<tag> */
  tag: string;
  /** Which column in the mega menu (1 = left, 2 = right) */
  column: 1 | 2;
  /** Optional badge */
  badge?: 'new' | 'top' | null;
}

export type MenuSubcategoriesMap = Record<CategoryKey, MenuSubcategory[]>;

export const DEFAULT_MENU_SUBCATEGORIES: MenuSubcategoriesMap = {
  flowers: [
    { key: 'mothers',     label: 'Ээжийн өдрийн цэцэг', tag: 'mothers-day', column: 1, badge: 'new' },
    { key: 'spring',      label: 'Хаврын цэцэг',         tag: 'spring',      column: 1 },
    { key: 'peony',       label: 'Пион',                 tag: 'peony',       column: 1, badge: 'new' },
    { key: 'sunflower',   label: 'Наран цэцэг',          tag: 'sunflower',   column: 1 },
    { key: 'letterbox',   label: 'Letterbox цэцэг',      tag: 'letterbox',   column: 1 },
    { key: 'hand-tied',   label: 'Гар утаст баглаа',     tag: 'hand-tied',   column: 1 },
    { key: 'premium-add', label: 'Нэмэлттэй цэцэг',      tag: 'premium',     column: 2, badge: 'new' },
    { key: 'dried',       label: 'Хатсан цэцэг',         tag: 'dried',       column: 2 },
    { key: 'luxury',      label: 'Тансаг цэцэг',         tag: 'luxury',      column: 2 },
    { key: 'monthly',     label: 'Сар тутмын цэцэг',     tag: 'monthly',     column: 2 },
    { key: 'vase',        label: 'Vase-тай цэцэг',       tag: 'vase',        column: 2, badge: 'new' },
    { key: 'eco',         label: 'Эко цуглуулга',        tag: 'eco',         column: 2 },
  ],
  plants: [
    { key: 'houseplant', label: 'House plant',     tag: 'houseplant', column: 1 },
    { key: 'orchid',     label: 'Орхид',           tag: 'orchid',     column: 1 },
    { key: 'succulent',  label: 'Суккулент',       tag: 'succulent',  column: 1 },
    { key: 'small',      label: 'Жижиг ургамал',   tag: 'small',      column: 1 },
    { key: 'pet-safe',   label: 'Pet-safe ургамал', tag: 'pet-safe',  column: 2, badge: 'new' },
    { key: 'low-cost',   label: '80K хүртэл',      tag: 'low-cost',   column: 2 },
    { key: 'low-light',  label: 'Бага гэрэл',      tag: 'low-light',  column: 2 },
  ],
  gifts: [
    { key: 'hamper',    label: 'Hamper цуглуулга', tag: 'hamper',    column: 1 },
    { key: 'chocolate', label: 'Шоколад',          tag: 'chocolate', column: 1 },
    { key: 'wine',      label: 'Дарс',             tag: 'wine',      column: 1 },
    { key: 'tea',       label: 'Цай',              tag: 'tea',       column: 1 },
    { key: 'premium-gift', label: 'Тансаг бэлэг',  tag: 'luxury',    column: 2 },
    { key: 'newborn',   label: 'Шинэ нярай',       tag: 'newborn',   column: 2 },
    { key: 'housewarm', label: 'Шинэ гэр',         tag: 'housewarming', column: 2 },
    { key: 'corp',      label: 'Корпорацийн',      tag: 'corporate', column: 2 },
  ],
  cards: [
    { key: 'birthday',   label: 'Төрсөн өдрийн card', tag: 'birthday', column: 1 },
    { key: 'thanks',     label: 'Талархал card',      tag: 'thanks',   column: 1 },
    { key: 'sympathy',   label: 'Тайтгарал card',     tag: 'sympathy', column: 1 },
    { key: 'wedding',    label: 'Хурим & сүй',        tag: 'wedding',  column: 2 },
    { key: 'newborn-card', label: 'Шинэ нярай',       tag: 'newborn',  column: 2 },
    { key: 'ai-writer',  label: 'AI Co-writer',        tag: 'ai-writer', column: 2, badge: 'new' },
  ],
  subs: [
    { key: 'petite',    label: 'Petite Weekly',    tag: 'weekly',    column: 1 },
    { key: 'signature', label: 'Signature Atelier', tag: 'monthly',  column: 1 },
    { key: 'premium-sub', label: 'Premium',        tag: 'premium',   column: 1 },
    { key: 'weekly',    label: '7 хоног тутам',    tag: 'weekly',    column: 2 },
    { key: 'monthly-sub', label: 'Сар тутам',      tag: 'monthly',   column: 2 },
  ],
};

export function getAllTags(subcategories: MenuSubcategoriesMap): string[] {
  const set = new Set<string>();
  for (const items of Object.values(subcategories)) {
    for (const sub of items) set.add(sub.tag);
  }
  return Array.from(set).sort();
}


// ============================================================
// Hero banners — admin-editable rotating homepage hero.
// Each slide has an image (URL or uploaded), heading, subheading.
// Stored under site_settings.hero_banners.
// ============================================================

export interface HeroBanner {
  /** Public image URL (Supabase Storage, external CDN, or Pollinations.ai). Empty = use fallback decoration. */
  image_url: string;
  /** H1 heading shown over/beside the image */
  heading: string;
  /** Short paragraph under the heading */
  subheading: string;
}

export interface HeroBannerConfig {
  slides: HeroBanner[];
  /** Auto-rotate interval in milliseconds (0 = no auto-rotate) */
  interval_ms: number;
}

export const DEFAULT_HERO_BANNERS: HeroBannerConfig = {
  slides: [
    {
      image_url: '',
      heading: 'Цэцэг илгээ. Урлагийг задал.',
      subheading:
        'AI чиний хайр, баяр, талархлыг ойлгож хамгийн тохирох цэцгийг сонгож өгнө. Letterbox-аас атриум хүртэл.',
    },
  ],
  interval_ms: 6000,
};

export function sanitizeHeroBannerConfig(
  raw: unknown
): HeroBannerConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_HERO_BANNERS;
  const obj = raw as Record<string, unknown>;
  const rawSlides = Array.isArray(obj.slides) ? obj.slides : [];
  const slides: HeroBanner[] = rawSlides
    .map((s) => {
      if (!s || typeof s !== 'object') return null;
      const v = s as Record<string, unknown>;
      const image_url =
        typeof v.image_url === 'string' ? v.image_url.trim().slice(0, 500) : '';
      const heading =
        typeof v.heading === 'string'
          ? v.heading.trim().slice(0, 120)
          : '';
      const subheading =
        typeof v.subheading === 'string'
          ? v.subheading.trim().slice(0, 400)
          : '';
      if (!heading && !image_url) return null;
      return { image_url, heading, subheading };
    })
    .filter((s): s is HeroBanner => s != null);
  const interval_ms =
    typeof obj.interval_ms === 'number' &&
    Number.isFinite(obj.interval_ms) &&
    obj.interval_ms >= 0
      ? Math.min(60000, Math.max(0, Math.floor(obj.interval_ms)))
      : DEFAULT_HERO_BANNERS.interval_ms;
  if (slides.length === 0) return DEFAULT_HERO_BANNERS;
  return { slides, interval_ms };
}
