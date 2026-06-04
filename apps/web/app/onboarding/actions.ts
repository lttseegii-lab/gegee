'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { MOODS_BY_KEY } from '@/lib/moods';
import { ONBOARDING_FLOWERS_BY_KEY } from '@/lib/onboarding-flowers';
import { getRewardsConfig } from '@/lib/rewards/getConfig';

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

  // Check whether this is the first completion.
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();
  const alreadyDone = profile?.onboarded_at != null;

  // Always stamp onboarded_at — idempotent: if already set, this re-writes
  // the same value or a newer one but doesn't grant points again.
  if (!alreadyDone) {
    const { error } = await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) return { error: error.message };
  }

  let awardedPoints = 0;
  if (!alreadyDone) {
    // Bonus amount is admin-configurable via /admin/rewards.
    const { signupBonus } = await getRewardsConfig();

    if (signupBonus > 0) {
      // Award the welcome-completion bonus. Use the service client because
      // rewards_ledger / user_rewards are admin-write under RLS.
      const svc = createServiceClient();

      const { data: rewards } = await svc
        .from('user_rewards')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentTotal = rewards?.total_points ?? 0;
      const newTotal = currentTotal + signupBonus;

      const { error: rewardErr } = await svc.from('user_rewards').upsert(
        { user_id: user.id, total_points: newTotal },
        { onConflict: 'user_id' }
      );

      if (!rewardErr) {
        const { error: ledgerErr } = await svc.from('rewards_ledger').insert({
          user_id: user.id,
          points: signupBonus,
          reason: 'Бүртгэл дуусгасан баяр — тавтай морил',
        });
        if (!ledgerErr) {
          awardedPoints = signupBonus;
        }
      }
    }
  }

  revalidatePath('/', 'layout');
  return {
    ok: true,
    next: next || '/account/profile',
    awardedPoints,
  };
}
