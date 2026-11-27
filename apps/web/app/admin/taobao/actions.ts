'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import { getTaobaoProvider } from '@/lib/taobao/provider';
import { parsePricing } from '@/lib/taobao/pricing';
import { translateItems, TranslateError, type TranslatorId } from '@/lib/taobao/translate';
import { parseImportInput, parseTranslateItem } from '@/lib/taobao/validate';
import { isTaobaoCategory, type TaobaoItem, type TaobaoPricing, type TaobaoTranslation } from '@/lib/taobao/types';

type Fail = { ok: false; error: string };

async function guard(): Promise<Fail | null> {
  try {
    await assertAdmin();
    return null;
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
}

export async function searchTaobao(
  category: string,
  query: string
): Promise<{ ok: true; items: TaobaoItem[] } | Fail> {
  const denied = await guard();
  if (denied) return denied;
  if (!isTaobaoCategory(category)) return { ok: false, error: 'Ангилал буруу байна.' };
  try {
    const items = await getTaobaoProvider().search({ category, query: String(query ?? '').slice(0, 80) });
    return { ok: true, items };
  } catch (error) {
    console.error('Taobao search failed:', error);
    return { ok: false, error: 'Taobao хайлт амжилтгүй боллоо.' };
  }
}

export async function translateTaobaoItem(
  input: unknown
): Promise<{ ok: true; translation: TaobaoTranslation; translator: TranslatorId } | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const item = parseTranslateItem(input);
  if (!item) return { ok: false, error: 'Барааны мэдээлэл буруу байна.' };
  try {
    const result = await translateItems([item]);
    return { ok: true, translation: result.items[0], translator: result.translator };
  } catch (error) {
    if (error instanceof TranslateError) return { ok: false, error: error.message };
    console.error('Taobao translate failed:', error);
    return { ok: false, error: 'Орчуулж чадсангүй.' };
  }
}

export async function importTaobaoProduct(
  input: unknown
): Promise<{ ok: true; id: string; active: boolean } | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = parseImportInput(input);
  if (!parsed.ok) return parsed;
  const p = parsed.value;

  const svc = createServiceClient();
  const { data: existing, error: lookupError } = await svc
    .from('product_sources')
    .select('product_id')
    .eq('source', 'taobao')
    .eq('item_id', p.source.itemId)
    .maybeSingle();
  if (lookupError) return { ok: false, error: lookupError.message };
  if (existing) return { ok: false, error: 'Энэ барааг аль хэдийн импортолсон байна.' };

  const { error: productError } = await svc.from('products').insert({
    id: p.productId,
    name: p.name,
    price: p.price,
    description: p.description || null,
    details: p.details,
    variants: p.variants,
    tags: p.tags,
    img_url: p.source.image,
    reviews: 0,
    active: p.active,
  });
  if (productError) {
    return {
      ok: false,
      error: productError.code === '23505' ? 'Ийм дугаартай бараа аль хэдийн байна.' : productError.message,
    };
  }

  const { error: sourceError } = await svc.from('product_sources').insert({
    product_id: p.productId,
    source: 'taobao',
    item_id: p.source.itemId,
    url: p.source.url,
    title_zh: p.source.titleZh,
    price_cny: p.source.priceCny,
    cost: p.cost,
    sample: p.source.sample,
  });
  if (sourceError) {
    // Never leave a product without its source row: the sample guard depends on it.
    await svc.from('products').delete().eq('id', p.productId);
    return { ok: false, error: sourceError.message };
  }

  revalidatePath('/admin/taobao');
  revalidatePath('/admin/products');
  revalidatePath('/catalog/[category]', 'page');
  revalidatePath('/');
  return { ok: true, id: p.productId, active: p.active };
}

export async function updateTaobaoPricing(
  input: unknown
): Promise<{ ok: true; pricing: TaobaoPricing } | Fail> {
  const denied = await guard();
  if (denied) return denied;
  const pricing = parsePricing(input);
  if (!pricing) return { ok: false, error: 'Ханш 1–100,000, ашиг 0–1000%, карго 0–1,000,000₮ хооронд бүхэл тоо байна.' };

  const svc = createServiceClient();
  const { error } = await svc
    .from('admin_settings')
    .upsert({ key: 'taobao_pricing', value: { ...pricing } }, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/taobao');
  return { ok: true, pricing };
}
