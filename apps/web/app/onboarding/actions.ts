'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MOODS_BY_KEY } from '@/lib/moods';
import { ONBOARDING_FLOWERS_BY_KEY } from '@/lib/onboarding-flowers';

export async function saveSignatureMood(key: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // The column is named `signature_mood` for legacy reasons but it now stores
  // either an onboarding flower key (preferred) OR an old mood key (legacy data).
  // Accept both so we don't break the existing signature_mood values in the DB.
  if (!ONBOARDING_FLOWERS_BY_KEY[key] && !MOODS_BY_KEY[key]) {
    return { error: 'Сонголт буруу байна' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ signature_mood: key })
    .eq('id', user.id);
  if (error) return { error: error.message };

  return { ok: true };
}

/**
 * Mark onboarding as complete (either by finishing all steps or skipping).
 * Returns the resolved `next` URL so the caller can redirect there.
 */
export async function finishOnboarding(next?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true, next: next || '/account/profile' };
}
