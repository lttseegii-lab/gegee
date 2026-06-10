'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface CreateOrderResult {
  ok: boolean;
  orderId?: number;
  orderCode?: string;
  total?: number;
  error?: string;
}

export interface DeliveryPayload {
  date: string;
  slot: 'asap' | '10-13' | '14-17' | '18-21';
  is_surprise: boolean;
  recipient_phone: string;
}

export interface CreateOrderArgs {
  addressId: number;
  notes?: string;
  cardMessage?: string;
  delivery?: DeliveryPayload;
}

/**
 * Creates an order from the user's current cart.
 *
 * All money math, delivery-date validation, capacity enforcement, and the
 * order + order_items insert + cart clear happen ATOMICALLY inside the
 * `create_order_from_cart` SECURITY DEFINER function (migration 0021). The
 * client never supplies a price or total — they are recomputed server-side
 * from live product prices, so a tampered payload cannot underpay.
 *
 * The returned orderId is handed to /checkout/payment, which creates the QPay
 * invoice (lib/qpay/client.ts) and shows the QR.
 */
export async function createOrderFromCart(
  args: CreateOrderArgs
): Promise<CreateOrderResult> {
  const { addressId: rawAddressId, notes, cardMessage, delivery } = args;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Нэвтэрнэ үү' };

  // Defend against a malformed client payload before it reaches Postgres.
  const addressId = Number(rawAddressId);
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return {
      ok: false,
      error: 'Хүргэлтийн хаяг буруу байна. Хаягаа дахин сонгоно уу.',
    };
  }

  const { data, error } = await supabase.rpc('create_order_from_cart', {
    p_address_id: addressId,
    p_notes: notes ?? null,
    p_card_message: cardMessage ?? null,
    p_delivery: delivery ? (delivery as unknown as Json) : null,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('CAPACITY_FULL') || msg.includes('CAPACITY_CLOSED')) {
      return {
        ok: false,
        error:
          'Сонгосон өдрийн захиалгын хязгаар дүүрсэн байна. Өөр өдөр сонгоно уу.',
      };
    }
    if (msg.includes('Cart is empty')) return { ok: false, error: 'Сагс хоосон' };
    if (msg.includes('Address not found')) return { ok: false, error: 'Хаяг олдсонгүй' };
    if (msg.includes('no longer available')) {
      return {
        ok: false,
        error: 'Сагсан дахь бараа идэвхгүй болсон байна. Сагсаа шинэчилнэ үү.',
      };
    }
    if (msg.includes('Invalid delivery')) {
      return { ok: false, error: 'Хүргэлтийн огноо эсвэл цаг буруу байна.' };
    }
    console.error('create_order_from_cart failed:', error.message);
    return { ok: false, error: 'Захиалга үүсгэхэд алдаа гарлаа' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: 'Захиалга үүсгэхэд алдаа гарлаа' };

  revalidatePath('/account/orders');

  return {
    ok: true,
    orderId: row.order_id,
    orderCode: row.order_code ?? undefined,
    total: row.total,
  };
}
