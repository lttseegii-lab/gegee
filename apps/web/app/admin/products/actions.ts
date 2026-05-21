'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';

function asStr(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}
function asInt(v: FormDataEntryValue | null): number | null {
  const s = asStr(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}
function asFloat(v: FormDataEntryValue | null): number | null {
  const s = asStr(v);
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
function asBool(v: FormDataEntryValue | null): boolean {
  return v === 'on' || v === 'true' || v === '1';
}
function asArr(v: FormDataEntryValue | null): string[] {
  const s = asStr(v);
  if (!s) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function createProduct(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const id = asStr(formData.get('id'));
  const name = asStr(formData.get('name'));
  const price = asInt(formData.get('price'));

  if (!id || !name || price == null) {
    return { error: 'id, name, price заавал' };
  }
  if (!/^[a-z0-9-]+$/.test(id)) {
    return { error: 'id зөвхөн жижиг үсэг, тоо, зураас байж болно' };
  }

  const payload = {
    id,
    name,
    price,
    rating: asFloat(formData.get('rating')) ?? null,
    reviews: asInt(formData.get('reviews')) ?? 0,
    badge: asStr(formData.get('badge')) || null,
    pet_safe: asBool(formData.get('pet_safe')),
    tags: asArr(formData.get('tags')),
    occasion: asArr(formData.get('occasion')),
    img_seed: asInt(formData.get('img_seed')) ?? null,
    img_prompt: asStr(formData.get('img_prompt')) || null,
    img_url: asStr(formData.get('img_url')) || null,
    active: asBool(formData.get('active')),
  };

  const { error } = await svc.from('products').insert(payload);
  if (error) return { error: error.message };

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/catalog/[category]', 'page');
  revalidatePath('/');
  redirect(`/admin/products/${id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const name = asStr(formData.get('name'));
  const price = asInt(formData.get('price'));

  if (!name || price == null) {
    return { error: 'name, price заавал' };
  }

  const payload = {
    name,
    price,
    rating: asFloat(formData.get('rating')) ?? null,
    reviews: asInt(formData.get('reviews')) ?? 0,
    badge: asStr(formData.get('badge')) || null,
    pet_safe: asBool(formData.get('pet_safe')),
    tags: asArr(formData.get('tags')),
    occasion: asArr(formData.get('occasion')),
    img_seed: asInt(formData.get('img_seed')) ?? null,
    img_prompt: asStr(formData.get('img_prompt')) || null,
    img_url: asStr(formData.get('img_url')) || null,
    active: asBool(formData.get('active')),
  };

  const { error } = await svc.from('products').update(payload).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/admin/products');
  revalidatePath('/catalog/[category]', 'page');
  revalidatePath(`/product/${id}`);
  revalidatePath('/');
  return { ok: true };
}

export async function toggleProductActive(id: string, active: boolean) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const svc = createServiceClient();
  const { error } = await svc.from('products').update({ active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/catalog/[category]', 'page');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteProduct(id: string) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const svc = createServiceClient();
  const { error } = await svc.from('products').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  revalidatePath('/catalog/[category]', 'page');
  revalidatePath('/');
  redirect('/admin/products');
}
