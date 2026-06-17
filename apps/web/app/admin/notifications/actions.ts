'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import { sendSms } from '@/lib/sms/callpro';
import { memoryReminderSms } from '@/lib/sms/templates';

async function logSms(
  svc: ReturnType<typeof createServiceClient>,
  phone: string,
  message: string,
  type: 'order_status' | 'memory_reminder',
  refId: string,
  result: { ok: boolean; error?: string }
) {
  await svc.from('sms_log').insert({
    phone,
    message,
    type,
    ref_id: refId,
    ok: result.ok,
    error: result.error ?? null,
  });
}

export async function sendMemoryReminderSms(memoryDateId: number) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();

  const { data, error } = await svc
    .from('memory_dates')
    .select(`
      id, name, occasion,
      month, day,
      profiles!inner(phone, name)
    `)
    .eq('id', memoryDateId)
    .single();

  if (error || !data) return { error: 'Memory date олдсонгүй' };

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const phone: string | null = profile?.phone ?? null;
  if (!phone) return { error: 'Хэрэглэгчийн утасны дугаар байхгүй' };

  const today = new Date();
  const thisYear = today.getFullYear();
  let target = new Date(thisYear, data.month - 1, data.day);
  if (target < today) target = new Date(thisYear + 1, data.month - 1, data.day);
  const daysUntil = Math.ceil((target.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);

  const message = memoryReminderSms(data.name, data.occasion, daysUntil);
  const result = await sendSms(phone, message);
  await logSms(svc, phone, message, 'memory_reminder', String(memoryDateId), result);

  return result.ok ? { ok: true } : { error: result.error };
}
