// Server-only reader for the admin-managed DIY catalog (flowers + wraps).
// Admin edits are stored as JSON in site_settings (keys diy_flowers /
// diy_wraps). Falls back to the static defaults whenever the setting is
// absent or invalid, so the builder always has a usable catalog.
import { createClient } from '@/lib/supabase/server';
import { DIY_FLOWERS, sanitizeDiyFlowers, type DiyFlower } from './flowers';
import { DIY_WRAPS, sanitizeDiyWraps, type DiyWrap } from './wraps';

export interface DiyCatalog {
  flowers: DiyFlower[];
  wraps: DiyWrap[];
}

async function readSetting(key: string): Promise<unknown> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function getDiyFlowers(): Promise<DiyFlower[]> {
  const list = sanitizeDiyFlowers(await readSetting('diy_flowers'));
  return list.length > 0 ? list : DIY_FLOWERS;
}

export async function getDiyWraps(): Promise<DiyWrap[]> {
  const list = sanitizeDiyWraps(await readSetting('diy_wraps'));
  return list.length > 0 ? list : DIY_WRAPS;
}

export async function getDiyCatalog(): Promise<DiyCatalog> {
  const [flowers, wraps] = await Promise.all([getDiyFlowers(), getDiyWraps()]);
  return { flowers, wraps };
}
