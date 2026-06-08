'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import { sanitizeDiyFlowers, type DiyFlower } from '@/lib/diy/flowers';
import { sanitizeDiyWraps, type DiyWrap } from '@/lib/diy/wraps';
import type { Json } from '@/types/database';

function revalidateDiy() {
  revalidatePath('/diy');
  revalidatePath('/admin/diy');
}

export async function updateDiyFlowers(payload: DiyFlower[]) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const cleaned = sanitizeDiyFlowers(payload);
  if (cleaned.length === 0) {
    return { error: 'Хамгийн багадаа нэг хүчинтэй цэцэг шаардлагатай' };
  }
  const svc = createServiceClient();
  const { error } = await svc.from('site_settings').upsert(
    { key: 'diy_flowers', value: cleaned as unknown as Json },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };
  revalidateDiy();
  return { ok: true, flowers: cleaned };
}

export async function updateDiyWraps(payload: DiyWrap[]) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const cleaned = sanitizeDiyWraps(payload);
  if (cleaned.length === 0) {
    return { error: 'Хамгийн багадаа нэг хүчинтэй боолт шаардлагатай' };
  }
  const svc = createServiceClient();
  const { error } = await svc.from('site_settings').upsert(
    { key: 'diy_wraps', value: cleaned as unknown as Json },
    { onConflict: 'key' }
  );
  if (error) return { error: error.message };
  revalidateDiy();
  return { ok: true, wraps: cleaned };
}

export async function resetDiyFlowers() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .delete()
    .eq('key', 'diy_flowers');
  if (error) return { error: error.message };
  revalidateDiy();
  return { ok: true };
}

export async function resetDiyWraps() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .delete()
    .eq('key', 'diy_wraps');
  if (error) return { error: error.message };
  revalidateDiy();
  return { ok: true };
}

/**
 * Upload a DIY flower photo to the mega-images bucket (reused — same
 * admin-write policy already in place). Returns the public URL.
 */
export async function uploadDiyImage(formData: FormData) {
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
  const name = `diy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
