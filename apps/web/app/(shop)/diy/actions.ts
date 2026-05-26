'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  DIY_FLOWERS_BY_KEY,
  type FlowerSelection,
} from '@/lib/diy/flowers';
import { DIY_WRAPS_BY_KEY } from '@/lib/diy/wraps';
import { calculatePrice } from '@/lib/diy/pricing';

export interface CreateDiyInput {
  selections: FlowerSelection[];
  wrapKey: string | null;
  variantKey: string;
  variantName: string;
  imageUrl: string;
  prompt: string;
  seed: number;
  customName?: string;
}

export interface CreateDiyResult {
  ok: boolean;
  productId?: string;
  error?: string;
}

/**
 * Create a custom DIY product (active=false so it doesn't appear in catalog)
 * and add it to the user's cart. Returns the new product id.
 */
export async function createDiyAndAddToCart(
  input: CreateDiyInput
): Promise<CreateDiyResult> {
  // Validate selections
  if (!input.selections || input.selections.length === 0) {
    return { ok: false, error: 'Цэцгийг сонгоно уу' };
  }
  for (const s of input.selections) {
    if (!DIY_FLOWERS_BY_KEY[s.key]) {
      return { ok: false, error: `Тодорхойгүй цэцэг: ${s.key}` };
    }
    if (s.qty < 0 || s.qty > 50) {
      return { ok: false, error: 'Тоо хэмжээ буруу' };
    }
  }
  if (input.wrapKey && !DIY_WRAPS_BY_KEY[input.wrapKey]) {
    return { ok: false, error: 'Боолт олдсонгүй' };
  }

  const pricing = calculatePrice(input.selections, input.wrapKey);
  if (pricing.total <= 0) {
    return { ok: false, error: 'Үнэ тооцох боломжгүй' };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Сагсанд нэмэхийн тулд нэвтэрнэ үү' };
  }

  // Generate a stable but unique id
  const stamp = Date.now().toString(36);
  const productId = `diy-${user.id.slice(0, 8)}-${stamp}`;

  // Build a human-readable description from selections
  const flowerSummary = input.selections
    .filter((s) => s.qty > 0)
    .map((s) => `${s.qty}× ${DIY_FLOWERS_BY_KEY[s.key].name}`)
    .join(', ');

  const wrapName = input.wrapKey
    ? DIY_WRAPS_BY_KEY[input.wrapKey].name
    : 'Боолтгүй';

  const customName =
    input.customName?.trim() ||
    `Миний баглаа · ${input.variantName}`;

  // Use service client to insert (bypass RLS — admin-only writes on products)
  const svc = createServiceClient();
  const { error: insertErr } = await svc.from('products').insert({
    id: productId,
    name: customName,
    price: pricing.total,
    rating: null,
    reviews: 0,
    badge: 'new-pill',
    pet_safe: false,
    tags: ['custom-diy', 'bouquet', input.variantKey],
    occasion: [],
    img_seed: input.seed,
    img_prompt: input.prompt,
    img_url: input.imageUrl,
    active: false, // Hidden from catalog
  });

  if (insertErr) {
    return { ok: false, error: `Бүтээгдэхүүн үүсгэхэд алдаа: ${insertErr.message}` };
  }

  // Add to cart (regular cart_items row)
  const { error: cartErr } = await supabase.from('cart_items').insert({
    user_id: user.id,
    product_id: productId,
    qty: 1,
  });
  if (cartErr) {
    return { ok: false, error: `Сагсанд нэмэхэд алдаа: ${cartErr.message}` };
  }

  revalidatePath('/');
  return { ok: true, productId };
}
