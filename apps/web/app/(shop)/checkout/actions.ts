'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/stores/cartStore';

export interface CreateOrderResult {
  ok: boolean;
  orderId?: number;
  orderCode?: string;
  total?: number;
  error?: string;
}

/**
 * Creates an order from the user's current cart.
 * - Validates cart contents against current product prices
 * - Inserts orders + order_items in a single round-trip
 * - Clears cart_items after successful order creation
 *
 * Sprint 4 follow-up: hand the orderId to QPay invoice creation
 * (apps/web/lib/qpay/createInvoice.ts) before redirecting to /checkout/payment.
 */
export async function createOrderFromCart(
  addressId: number,
  notes?: string,
  cardMessage?: string
): Promise<CreateOrderResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Нэвтэрнэ үү' };

  // 1) Verify address belongs to user
  const { data: address } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single();
  if (!address) return { ok: false, error: 'Хаяг олдсонгүй' };

  // 2) Fetch cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('product_id, qty')
    .eq('user_id', user.id);
  if (!cartItems || cartItems.length === 0) {
    return { ok: false, error: 'Сагс хоосон' };
  }

  // 3) Snapshot current product prices
  const productIds = cartItems.map((c) => c.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, active')
    .in('id', productIds);
  if (!products || products.length === 0) {
    return { ok: false, error: 'Бүтээгдэхүүн олдсонгүй' };
  }

  // Validate all products still active
  for (const ci of cartItems) {
    const p = products.find((p) => p.id === ci.product_id);
    if (!p || !p.active) {
      return { ok: false, error: `Бүтээгдэхүүн идэвхгүй болсон: ${ci.product_id}` };
    }
  }

  // 4) Calculate totals
  const lineItems = cartItems.map((ci) => {
    const p = products.find((p) => p.id === ci.product_id)!;
    return {
      product_id: ci.product_id,
      qty: ci.qty,
      unit_price: p.price,
      line_total: p.price * ci.qty,
    };
  });
  const subtotal = lineItems.reduce((sum, li) => sum + li.line_total, 0);
  const delivery_fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery_fee;

  // 4.5) Reserve capacity for today (next-day delivery later in Phase 2)
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: reserved, error: capErr } = await supabase.rpc(
    'try_reserve_capacity',
    { target_date: todayStr }
  );
  if (capErr) {
    console.warn('Capacity reserve error (non-fatal):', capErr.message);
  } else if (reserved === false) {
    return {
      ok: false,
      error:
        'Өнөөдөр захиалгын хязгаар дүүрсэн байна. Бид удахгүй ажилладаг болно. Дараа дахин оролдоно уу.',
    };
  }

  // 5) Insert order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      address_id: addressId,
      subtotal,
      delivery_fee,
      total,
      notes: notes ?? null,
      card_message: cardMessage?.trim() || null,
      status: 'pending_payment',
    })
    .select('id, order_code, total')
    .single();
  if (orderErr || !order) {
    console.error('Order insert failed', orderErr);
    return { ok: false, error: orderErr?.message ?? 'Захиалга үүсгэхэд алдаа гарлаа' };
  }

  // 6) Insert order_items
  const { error: itemsErr } = await supabase.from('order_items').insert(
    lineItems.map((li) => ({
      order_id: order.id,
      product_id: li.product_id,
      qty: li.qty,
      unit_price: li.unit_price,
    }))
  );
  if (itemsErr) {
    console.error('Order items insert failed', itemsErr);
    // Best-effort rollback
    await supabase.from('orders').delete().eq('id', order.id);
    return { ok: false, error: itemsErr.message };
  }

  // 7) Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  revalidatePath('/account/orders');

  return {
    ok: true,
    orderId: order.id,
    orderCode: order.order_code ?? undefined,
    total: order.total,
  };
}
