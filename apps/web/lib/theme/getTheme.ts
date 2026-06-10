// Server-side helper to fetch theme settings + merge with defaults.
// Used by MainHeader (Server Component) on every render. Each reader is wrapped
// in React cache() so repeated reads of the same key within a single request
// (e.g. the header and a page both reading menu_subcategories) collapse to one
// round-trip. revalidatePath('/') refreshes the data after an admin theme edit.

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_MENU_COLORS,
  DEFAULT_MENU_IMAGES,
  DEFAULT_MENU_SUBCATEGORIES,
  DEFAULT_HERO_BANNERS,
  sanitizeHeroBannerConfig,
  type MenuColorMap,
  type MenuImagesMap,
  type MenuSubcategoriesMap,
  type HeroBannerConfig,
  type CategoryKey,
} from './palette';

export const getMenuColors = cache(async (): Promise<MenuColorMap> => {
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
});

export const getMenuImages = cache(async (): Promise<MenuImagesMap> => {
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
});

export const getMenuSubcategories = cache(
  async (): Promise<MenuSubcategoriesMap> => {
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
);

export const getHeroBanners = cache(async (): Promise<HeroBannerConfig> => {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_banners')
      .maybeSingle();
    if (!data?.value) return DEFAULT_HERO_BANNERS;
    return sanitizeHeroBannerConfig(data.value);
  } catch {
    return DEFAULT_HERO_BANNERS;
  }
});

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
