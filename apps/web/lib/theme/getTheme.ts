// Server-side helper to fetch theme settings + merge with defaults.
// Used by MainHeader (Server Component) on every render. Supabase caches
// queries automatically; revalidatePath('/') triggers a refresh after admin
// updates theme.

import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_MENU_COLORS,
  type MenuColorMap,
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
