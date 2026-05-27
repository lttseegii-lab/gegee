'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OCCASION_KEYS, type OccasionKey } from '@/lib/memory/occasions';

function asStr(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function asInt(v: FormDataEntryValue | null): number | null {
  const s = asStr(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}
function asBool(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true' || v === '1';
}

export async function createMemoryDate(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/memory-garden');

  const name = asStr(formData.get('name'));
  const month = asInt(formData.get('month'));
  const day = asInt(formData.get('day'));
  const year = asInt(formData.get('year'));
  const occasion = asStr(formData.get('occasion')) as OccasionKey;
  const notes = asStr(formData.get('notes')) || null;
  const reminders_enabled = formData.get('reminders_enabled') == null ? true : asBool(formData.get('reminders_enabled'));

  if (!name) return { error: 'Нэр заавал' };
  if (!month || !day) return { error: 'Сар ба өдөр заавал' };
  if (!OCCASION_KEYS.includes(occasion)) {
    return { error: 'Үйл явдлын төрлийг сонгоно уу' };
  }
  if (day > 31 || day < 1 || month > 12 || month < 1) {
    return { error: 'Сар/өдөр буруу' };
  }

  // Note: ai_suggested_product_id is no longer populated automatically.
  // Order history (orders.memory_date_id) provides the meaningful link instead.
  const { error } = await supabase.from('memory_dates').insert({
    user_id: user.id,
    name,
    month,
    day,
    year,
    occasion,
    notes,
    reminders_enabled,
  });
  if (error) return { error: error.message };

  revalidatePath('/account/memory-garden');
  return { ok: true };
}

export async function updateMemoryDate(id: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/memory-garden');

  const occasion = asStr(formData.get('occasion')) as OccasionKey;
  const month = asInt(formData.get('month'));
  const day = asInt(formData.get('day'));

  if (!month || !day) return { error: 'Сар ба өдөр заавал' };

  const updates = {
    name: asStr(formData.get('name')),
    month,
    day,
    year: asInt(formData.get('year')),
    occasion,
    notes: asStr(formData.get('notes')) || null,
    reminders_enabled: formData.get('reminders_enabled') == null ? true : asBool(formData.get('reminders_enabled')),
  };

  const { error } = await supabase
    .from('memory_dates')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/account/memory-garden');
  return { ok: true };
}

export async function deleteMemoryDate(id: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/memory-garden');

  const { error } = await supabase
    .from('memory_dates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/account/memory-garden');
  return { ok: true };
}

export async function toggleReminders(id: number, enabled: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Нэвтэрнэ үү' };
  const { error } = await supabase
    .from('memory_dates')
    .update({ reminders_enabled: enabled })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/account/memory-garden');
  return { ok: true };
}
