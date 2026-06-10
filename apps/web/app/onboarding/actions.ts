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
 *
 * The FIRST time this runs for a user (onboarded_at was null) we also award
 * an onboarding bonus to their rewards balance. Subsequent calls are no-ops
 * — re-visiting /onboarding doesn't double-award.
 *
 * Returns the resolved `next` URL plus the number of points just awarded
 * (0 if the user was already onboarded), so the caller can render a
 * celebration screen only when appropriate.
 */
export async function finishOnboarding(next?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Atomically claim the one-time onboarding bonus. The DB function flips
  // onboarded_at AND grants the bonus in a single transaction (see migration
  // 0020 claim_signup_bonus), so concurrent calls can no longer double-award —
  // the previous read-check-write here was a TOCTOU race.
  const { data: awardedPoints, error } = await supabase.rpc('claim_signup_bonus');
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return {
    ok: true,
    next: next || '/account/profile',
    awardedPoints: awardedPoints ?? 0,
  };
}
