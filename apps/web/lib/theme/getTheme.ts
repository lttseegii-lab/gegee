// Server-side helper to fetch theme settings + merge with defaults.
// Used by MainHeader (Server Component) on every render. Supabase caches
// queries automatically; revalidatePath('/') triggers a refresh after admin
// updates theme.

import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_MENU_COLORS,
  DEFAULT_MENU_IMAGES,
  DEFAULT_MENU_SUBCATEGORIES,
  type MenuColorMap,
  type MenuImagesMap,
  type MenuSubcategoriesMap,
  type CategoryKey,
} from './palette';

export async function getMenuColors(): Promise<MenuColorMap> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'menu_colors')
      .maybeSingle();
    if (!data?.value) return DEFAULT_MENU_COLORS;
    const v = data.value as Partial<MenuColorMap>;
    return { ...DEFAULT_MENU_COLORS, ...v };
  } catch {
    return DEFAULT_MENU_COLORS;
  }
}

export async function getMenuImages(): Promise<MenuImagesMap> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'menu_images')
      .maybeSingle();
    if (!data?.value) return DEFAULT_MENU_IMAGES;
    const v = data.value as Partial<MenuImagesMap>;
    // Merge per-category — fall back to defaults for any missing category.
    return {
      flowers: v.flowers ?? DEFAULT_MENU_IMAGES.flowers,
      plants: v.plants ?? DEFAULT_MENU_IMAGES.plants,
      gifts: v.gifts ?? DEFAULT_MENU_IMAGES.gifts,
      cards: v.cards ?? DEFAULT_MENU_IMAGES.cards,
      subs: v.subs ?? DEFAULT_MENU_IMAGES.subs,
    };
  } catch {
    return DEFAULT_MENU_IMAGES;
  }
}

export async function getMenuSubcategories(): Promise<MenuSubcategoriesMap> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'menu_subcategories')
      .maybeSingle();
    if (!data?.value) return DEFAULT_MENU_SUBCATEGORIES;
    const v = data.value as Partial<MenuSubcategoriesMap>;
    return {
      flowers: v.flowers ?? DEFAULT_MENU_SUBCATEGORIES.flowers,
      plants: v.plants ?? DEFAULT_MENU_SUBCATEGORIES.plants,
      gifts: v.gifts ?? DEFAULT_MENU_SUBCATEGORIES.gifts,
      cards: v.cards ?? DEFAULT_MENU_SUBCATEGORIES.cards,
      subs: v.subs ?? DEFAULT_MENU_SUBCATEGORIES.subs,
    };
  } catch {
    return DEFAULT_MENU_SUBCATEGORIES;
  }
}

/** Maps a tab label to its category key (for theme lookup) */
export function tabLabelToCategoryKey(label: string): CategoryKey | null {
  switch (label) {
    case 'Цэцэг':
      return 'flowers';
    case 'Ургамал':
      return 'plants';
    case 'Бэлэг':
      return 'gifts';
    case 'Карт':
      return 'cards';
    case 'Захиалгат':
      return 'subs';
    default:
      return null;
  }
}
