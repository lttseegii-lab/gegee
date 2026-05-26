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
