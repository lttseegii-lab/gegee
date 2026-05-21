'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';

export async function upsertCapacity(
  date: string,
  payload: { max_orders?: number; closed?: boolean; notes?: string }
) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();

  // Upsert by date
  const { error } = await svc
    .from('daily_capacity')
    .upsert({ date, ...payload }, { onConflict: 'date' });

  if (error) return { error: error.message };

  revalidatePath('/admin/capacity');
  revalidatePath('/admin');
  return { ok: true };
}
