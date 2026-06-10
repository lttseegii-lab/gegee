'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { diyFlowersByKey, type FlowerSelection } from '@/lib/diy/flowers';
import { diyWrapsByKey } from '@/lib/diy/wraps';
import { calculatePrice } from '@/lib/diy/pricing';
import { getDiyFlowers, getDiyWraps } from '@/lib/diy/getDiyCatalog';

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

  // Load the admin-managed catalog for authoritative validation + pricing.
  const [flowersList, wrapsList] = await Promise.all([
    getDiyFlowers(),
    getDiyWraps(),
  ]);
  const flowersByKey = diyFlowersByKey(flowersList);
  const wrapsByKey = diyWrapsByKey(wrapsList);

  for (const s of input.selections) {
    if (!flowersByKey[s.key]) {
      return { ok: false, error: `Тодорхойгүй цэцэг: ${s.key}` };
    }
    if (s.qty < 0 || s.qty > 20) {
      return { ok: false, error: 'Тоо хэмжээ буруу' };
    }
  }
  if (input.wrapKey && !wrapsByKey[input.wrapKey]) {
    return { ok: false, error: 'Боолт олдсонгүй' };
  }

  const pricing = calculatePrice(
    input.selections,
    input.wrapKey,
    flowersByKey,
    wrapsByKey
  );
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
    .map((s) => `${s.qty}× ${flowersByKey[s.key].name}`)
    .join(', ');

  const wrapName = input.wrapKey
    ? wrapsByKey[input.wrapKey].name
    : 'Боолтгүй';

  const customName =
    input.customName?.trim() ||
    `Миний баглаа · ${input.variantName}`;

  // Validate the client-supplied image URL — https + an allowlisted host only
  // (it is later rendered via next/image). Fall back to empty (the image helper
  // regenerates from prompt + seed) rather than storing an arbitrary URL.
  let safeImageUrl = '';
  try {
    const u = new URL(input.imageUrl);
    if (
      u.protocol === 'https:' &&
      (u.hostname === 'image.pollinations.ai' ||
        u.hostname.endsWith('.supabase.co'))
    ) {
      safeImageUrl = u.toString();
    }
  } catch {
    // invalid URL → leave empty
  }

  // Use service client to insert (bypass RLS — admin-only writes on products)
  const svc = createServiceClient();
  const { error: insertErr } = await svc.from('products').insert({
    id: productId,
    name: customName.slice(0, 80),
    price: pricing.total,
    rating: null,
    reviews: 0,
    badge: 'new-pill',
    pet_safe: false,
    tags: ['custom-diy', 'bouquet', input.variantKey],
    occasion: [],
    img_seed: input.seed,
    img_prompt: input.prompt.slice(0, 500),
    img_url: safeImageUrl,
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
