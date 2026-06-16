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
function asJsonArr(v: FormDataEntryValue | null): string[] {
  const s = asStr(v);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Upload a product image to Storage (public `mega-images` bucket, admin-only)
 * and return its public URL. The ProductForm stores this in `img_url`, which
 * takes precedence over runtime Pollinations generation.
 */
export async function uploadProductImage(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'Файл олдсонгүй' };
  if (file.size === 0) return { error: 'Файл хоосон' };
  if (file.size > 10 * 1024 * 1024)
    return { error: 'Файл хэт том (10MB-ээс хэтэрсэн)' };
  if (!file.type.startsWith('image/'))
    return { error: 'Зөвхөн зураг оруулна уу' };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 6);
  const name = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const svc = createServiceClient();
  const { error: uploadErr } = await svc.storage
    .from('mega-images')
    .upload(name, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadErr) return { error: uploadErr.message };

  const { data: pub } = svc.storage.from('mega-images').getPublicUrl(name);
  return { ok: true, url: pub.publicUrl };
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
    gallery_urls: asJsonArr(formData.get('gallery_urls')),
    active: asBool(formData.get('active')),
    is_gift_upsell: asBool(formData.get('is_gift_upsell')),
    is_card_upsell: asBool(formData.get('is_card_upsell')),
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
    gallery_urls: asJsonArr(formData.get('gallery_urls')),
    active: asBool(formData.get('active')),
    is_gift_upsell: asBool(formData.get('is_gift_upsell')),
    is_card_upsell: asBool(formData.get('is_card_upsell')),
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
