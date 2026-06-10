'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import {
  DEFAULT_REWARDS_CONFIG,
  sanitizeRewardsConfig,
} from '@/lib/rewards/config';
import type { Json } from '@/types/database';

function asInt(v: FormDataEntryValue | null): number | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}
function asStr(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Manually adjust a user's points. Inserts a row into rewards_ledger and
 * updates user_rewards.total_points atomically.
 *
 * Positive points = credit; negative = debit (clamps total >= 0).
 */
export async function adjustUserPoints(userId: string, formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const points = asInt(formData.get('points'));
  const reason = asStr(formData.get('reason'));

  if (points == null || points === 0) {
    return { error: 'Оноо 0-ээс ялгаатай байх ёстой' };
  }
  if (!reason) {
    return { error: 'Шалтгаан заавал' };
  }
  if (Math.abs(points) > 100000) {
    return { error: 'Хэт их утга — нэг гүйлгээгээр 100,000-аас илүү оноо тохируулж болохгүй' };
  }

  const svc = createServiceClient();

  // 1. Ledger entry
  const { error: ledgerErr } = await svc.from('rewards_ledger').insert({
    user_id: userId,
    points,
    reason: `Admin: ${reason}`,
  });
  if (ledgerErr) return { error: ledgerErr.message };

  // 2. Update aggregate. We use a select + update because the JS client
  //    doesn't expose `points = points + N` atomic increment.
  const { data: row } = await svc
    .from('user_rewards')
    .select('total_points')
    .eq('user_id', userId)
    .maybeSingle();

  const current = row?.total_points ?? 0;
  const next = Math.max(0, current + points);

  const { error: updateErr } = await svc
    .from('user_rewards')
    .upsert({ user_id: userId, total_points: next }, { onConflict: 'user_id' });

  if (updateErr) return { error: updateErr.message };

  revalidatePath('/admin/rewards');
  revalidatePath(`/admin/rewards/${userId}`);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath('/account/rewards');
  return { ok: true };
}

// ============================================================
// Signup bonus configuration
// ============================================================

function asFloat(v: FormDataEntryValue | null): number | null {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export async function updateRewardsConfig(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const signupBonus = asInt(formData.get('signupBonus'));
  const earnRatePercent = asFloat(formData.get('earnRatePercent'));

  if (signupBonus == null) {
    return { error: 'Бэлгийн оноо тоо байх ёстой' };
  }
  if (earnRatePercent == null) {
    return { error: 'Хувь тоо байх ёстой' };
  }

  const cleaned = sanitizeRewardsConfig({ signupBonus, earnRatePercent });

  const svc = createServiceClient();
  const { error } = await svc.from('site_settings').upsert(
    {
      key: 'rewards_config',
      value: cleaned as unknown as Json,
    },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };

  revalidatePath('/admin/rewards');
  revalidatePath('/account/rewards');
  return {
    ok: true,
    signupBonus: cleaned.signupBonus,
    earnRatePercent: cleaned.earnRatePercent,
  };
}

export async function resetRewardsConfig() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc.from('site_settings').upsert(
    {
      key: 'rewards_config',
      value: DEFAULT_REWARDS_CONFIG as unknown as Json,
    },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };

  revalidatePath('/admin/rewards');
  revalidatePath('/account/rewards');
  return {
    ok: true,
    signupBonus: DEFAULT_REWARDS_CONFIG.signupBonus,
    earnRatePercent: DEFAULT_REWARDS_CONFIG.earnRatePercent,
  };
}

export async function deleteLedgerEntry(userId: string, entryId: number) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();

  // Get the entry first so we know how many points (and spend) to reverse
  const { data: entry } = await svc
    .from('rewards_ledger')
    .select('points, user_id, order_id')
    .eq('id', entryId)
    .single();

  if (!entry || entry.user_id !== userId) {
    return { error: 'Ledger entry not found' };
  }

  const { error: delErr } = await svc
    .from('rewards_ledger')
    .delete()
    .eq('id', entryId);
  if (delErr) return { error: delErr.message };

  // Order-derived entries also moved total_spent (the tier driver): a credit
  // (+points) added the order total, a refund reversal (−points) subtracted it.
  // Undo that same effect so the customer doesn't keep an unearned tier.
  // Manual admin adjustments (no order_id) never touched total_spent.
  let spentDelta = 0;
  if (entry.order_id) {
    const { data: ord } = await svc
      .from('orders')
      .select('total')
      .eq('id', entry.order_id)
      .maybeSingle();
    const total = ord?.total ?? 0;
    spentDelta = entry.points >= 0 ? total : -total;
  }

  const { data: row } = await svc
    .from('user_rewards')
    .select('total_points, total_spent')
    .eq('user_id', userId)
    .maybeSingle();
  const currentPoints = row?.total_points ?? 0;
  const currentSpent = row?.total_spent ?? 0;
  await svc.from('user_rewards').upsert(
    {
      user_id: userId,
      total_points: Math.max(0, currentPoints - entry.points),
      total_spent: Math.max(0, currentSpent - spentDelta),
    },
    { onConflict: 'user_id' }
  );

  revalidatePath(`/admin/rewards/${userId}`);
  return { ok: true };
}
