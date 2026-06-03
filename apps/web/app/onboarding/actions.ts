'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MOODS_BY_KEY } from '@/lib/moods';

export async function saveSignatureMood(moodKey: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  if (!MOODS_BY_KEY[moodKey]) {
    return { error: 'Mood буруу байна' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ signature_mood: moodKey })
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
