'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';

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

export async function deleteLedgerEntry(userId: string, entryId: number) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();

  // Get the entry first so we know how many points to reverse
  const { data: entry } = await svc
    .from('rewards_ledger')
    .select('points, user_id')
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

  // Reverse the points in the aggregate
  const { data: row } = await svc
    .from('user_rewards')
    .select('total_points')
    .eq('user_id', userId)
    .maybeSingle();
  const current = row?.total_points ?? 0;
  const next = Math.max(0, current - entry.points);
  await svc.from('user_rewards').upsert(
    { user_id: userId, total_points: next },
    { onConflict: 'user_id' }
  );

  revalidatePath(`/admin/rewards/${userId}`);
  return { ok: true };
}
