'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/profile');

  const name = asString(formData.get('name'));
  const phoneRaw = asString(formData.get('phone'));

  if (!name) {
    return { error: 'Нэрээ оруулна уу' };
  }
  if (name.length > 80) {
    return { error: 'Нэр 80 тэмдэгтээс хэтрэхгүй байх ёстой' };
  }

  // Light phone normalization: keep digits, '+', spaces.
  const phone = phoneRaw
    ? phoneRaw.replace(/[^\d+\s-]/g, '').trim() || null
    : null;

  const { error } = await supabase
    .from('profiles')
    .update({ name, phone })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/account/profile');
  revalidatePath('/account', 'layout');
  return { ok: true };
}
