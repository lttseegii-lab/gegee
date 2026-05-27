'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function asBool(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true' || v === '1';
}

export async function createAddress(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/addresses');

  const payload = {
    user_id: user.id,
    label: asString(formData.get('label')) || 'Гэр',
    recipient: asString(formData.get('recipient')),
    phone: asString(formData.get('phone')),
    city: asString(formData.get('city')) || 'Улаанбаатар',
    district: asString(formData.get('district')) || null,
    khoroo: asString(formData.get('khoroo')) || null,
    building: asString(formData.get('building')) || null,
    entrance: asString(formData.get('entrance')) || null,
    floor: asString(formData.get('floor')) || null,
    unit: asString(formData.get('unit')) || null,
    notes: asString(formData.get('notes')) || null,
    is_default: asBool(formData.get('is_default')),
  };

  if (!payload.recipient || !payload.phone) {
    return { error: 'Хүлээн авагч ба утасны дугаараа оруулна уу' };
  }

  // If this is the first address, mark as default
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((count ?? 0) === 0) payload.is_default = true;

  // If marked as default, clear other defaults first
  if (payload.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { error } = await supabase.from('addresses').insert(payload);
  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  return { ok: true };
}

export async function deleteAddress(addressId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  return { ok: true };
}

export async function setDefaultAddress(addressId: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase.rpc('set_default_address', {
    addr_id: addressId,
  });
  if (error) return { error: error.message };

  revalidatePath('/account/addresses');
  return { ok: true };
}
