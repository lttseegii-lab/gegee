'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import {
  COLOR_BY_KEY,
  DEFAULT_MENU_COLORS,
  type MenuColorMap,
  type CategoryKey,
} from '@/lib/theme/palette';

export async function updateMenuColors(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const next: MenuColorMap = { ...DEFAULT_MENU_COLORS };

  for (const cat of Object.keys(DEFAULT_MENU_COLORS) as CategoryKey[]) {
    const raw = formData.get(cat);
    const key = typeof raw === 'string' ? raw : '';
    if (key && COLOR_BY_KEY[key]) {
      next[cat] = key;
    }
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_colors', value: next },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  // Revalidate everything that uses the header
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetMenuColors() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_colors', value: DEFAULT_MENU_COLORS },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}
