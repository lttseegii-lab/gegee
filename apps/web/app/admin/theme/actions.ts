'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import {
  COLOR_BY_KEY,
  DEFAULT_MENU_COLORS,
  DEFAULT_MENU_IMAGES,
  DEFAULT_MENU_SUBCATEGORIES,
  DEFAULT_HERO_BANNERS,
  IMAGE_GRADIENT_BY_KEY,
  sanitizeHeroBannerConfig,
  type MenuColorMap,
  type MenuImagesMap,
  type MenuSubcategoriesMap,
  type MenuSubcategory,
  type MegaImageConfig,
  type HeroBannerConfig,
  type CategoryKey,
} from '@/lib/theme/palette';
import type { Json } from '@/types/database';

export async function updateMenuColors(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const next: MenuColorMap = { ...DEFAULT_MENU_COLORS };

  for (const cat of Object.keys(DEFAULT_MENU_COLORS) as CategoryKey[]) {
    const raw = formData.get(cat);
    const key = typeof raw === 'string' ? raw : '';
    if (key && COLOR_BY_KEY[key]) {
      next[cat] = key;
    }
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_colors', value: next },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  // Revalidate everything that uses the header
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetMenuColors() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_colors', value: DEFAULT_MENU_COLORS },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

// ============================================================
// Mega menu images
// ============================================================

function sanitizeImage(v: unknown): MegaImageConfig | null {
  if (!v || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;
  const emoji = typeof obj.emoji === 'string' ? obj.emoji.trim().slice(0, 4) : '';
  const label = typeof obj.label === 'string' ? obj.label.trim().slice(0, 40) : '';
  const href = typeof obj.href === 'string' ? obj.href.trim().slice(0, 200) : '';
  const gradientRaw = typeof obj.gradient === 'string' ? obj.gradient : '';
  const gradient = IMAGE_GRADIENT_BY_KEY[gradientRaw]
    ? gradientRaw
    : 'pink-blush';
  if (!emoji || !label || !href) return null;
  if (!href.startsWith('/')) return null;
  return { emoji, label, href, gradient };
}

export async function updateMenuImages(payload: MenuImagesMap) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const cleaned: MenuImagesMap = {
    flowers: (payload.flowers ?? []).map(sanitizeImage).filter(Boolean).slice(0, 2) as MegaImageConfig[],
    plants:  (payload.plants  ?? []).map(sanitizeImage).filter(Boolean).slice(0, 2) as MegaImageConfig[],
    gifts:   (payload.gifts   ?? []).map(sanitizeImage).filter(Boolean).slice(0, 2) as MegaImageConfig[],
    cards:   (payload.cards   ?? []).map(sanitizeImage).filter(Boolean).slice(0, 2) as MegaImageConfig[],
    subs:    (payload.subs    ?? []).map(sanitizeImage).filter(Boolean).slice(0, 2) as MegaImageConfig[],
  };

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      // value is jsonb — cast through unknown because MegaImageConfig lacks a
      // string index signature required by Supabase's Json type.
      { key: 'menu_images', value: cleaned as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetMenuImages() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_images', value: DEFAULT_MENU_IMAGES as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

// ============================================================
// Mega menu sub-categories (col 1 + col 2 link lists)
// ============================================================

function sanitizeSubcategory(v: unknown): MenuSubcategory | null {
  if (!v || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;
  const key = typeof obj.key === 'string' ? obj.key.trim().slice(0, 40) : '';
  const label = typeof obj.label === 'string' ? obj.label.trim().slice(0, 60) : '';
  const tag = typeof obj.tag === 'string' ? obj.tag.trim().slice(0, 40) : '';
  const column = obj.column === 2 ? 2 : 1;
  const badgeRaw = typeof obj.badge === 'string' ? obj.badge : null;
  const badge = badgeRaw === 'new' || badgeRaw === 'top' ? badgeRaw : null;
  if (!key || !label || !tag) return null;
  if (!/^[a-z0-9-]+$/i.test(tag)) return null;
  return { key, label, tag, column, badge };
}

export async function updateMenuSubcategories(payload: MenuSubcategoriesMap) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const cleaned: MenuSubcategoriesMap = {
    flowers: (payload.flowers ?? []).map(sanitizeSubcategory).filter(Boolean).slice(0, 24) as MenuSubcategory[],
    plants:  (payload.plants  ?? []).map(sanitizeSubcategory).filter(Boolean).slice(0, 24) as MenuSubcategory[],
    gifts:   (payload.gifts   ?? []).map(sanitizeSubcategory).filter(Boolean).slice(0, 24) as MenuSubcategory[],
    cards:   (payload.cards   ?? []).map(sanitizeSubcategory).filter(Boolean).slice(0, 24) as MenuSubcategory[],
    subs:    (payload.subs    ?? []).map(sanitizeSubcategory).filter(Boolean).slice(0, 24) as MenuSubcategory[],
  };

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_subcategories', value: cleaned as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetMenuSubcategories() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'menu_subcategories', value: DEFAULT_MENU_SUBCATEGORIES as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { ok: true };
}

// ============================================================
// Hero banners (homepage carousel)
// ============================================================

export async function updateHeroBanners(payload: HeroBannerConfig) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const cleaned = sanitizeHeroBannerConfig(payload);
  // Limit slides to a reasonable max
  const trimmed: HeroBannerConfig = {
    slides: cleaned.slides.slice(0, 6),
    interval_ms: cleaned.interval_ms,
  };

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'hero_banners', value: trimmed as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  revalidatePath('/');
  return { ok: true };
}

export async function resetHeroBanners() {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from('site_settings')
    .upsert(
      { key: 'hero_banners', value: DEFAULT_HERO_BANNERS as unknown as Json },
      { onConflict: 'key' }
    );
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  revalidatePath('/');
  return { ok: true };
}

/**
 * Upload a hero banner image to Supabase Storage and return its public URL.
 * Called from the admin form when the user picks a local file.
 *
 * Accepts a FormData with a single 'file' field. Returns { url } or { error }.
 */
export async function uploadHeroBanner(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { error: 'Файл олдсонгүй' };
  }
  if (file.size === 0) {
    return { error: 'Файл хоосон' };
  }
  // ~10MB cap
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'Файл хэт том (10MB-ээс хэтэрсэн)' };
  }
  if (!file.type.startsWith('image/')) {
    return { error: 'Зөвхөн зураг оруулна уу' };
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 6);
  const name = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const svc = createServiceClient();
  const { error: uploadErr } = await svc.storage
    .from('hero-banners')
    .upload(name, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadErr) return { error: uploadErr.message };

  const { data: pub } = svc.storage.from('hero-banners').getPublicUrl(name);
  return { ok: true, url: pub.publicUrl };
}
