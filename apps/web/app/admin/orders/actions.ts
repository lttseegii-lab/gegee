'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import type { OrderStatus } from '@/types/database';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled', 'refunded'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export async function updateOrderStatus(orderId: number, next: OrderStatus) {
  try {
    await assertAdmin();
  } catch {
    return { error: 'Forbidden' };
  }

  const supabase = createClient();
  const { data: current } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();
  if (!current) return { error: 'Захиалга олдсонгүй' };

  const cur = (current.status ?? 'pending_payment') as OrderStatus;
  const allowed = VALID_TRANSITIONS[cur] ?? [];
  if (!allowed.includes(next)) {
    return {
      error: `${cur} → ${next} шилжилт боломжгүй (зөвшөөрөгдсөн: ${allowed.join(', ') || 'үгүй'})`,
    };
  }

  // Use service client to bypass RLS for status changes
  const svc = createServiceClient();
  const updates: {
    status: OrderStatus;
    paid_at?: string;
    delivered_at?: string;
  } = { status: next };
  if (next === 'paid') updates.paid_at = new Date().toISOString();
  if (next === 'delivered') updates.delivered_at = new Date().toISOString();

  const { error } = await svc
    .from('orders')
    .update(updates)
    .eq('id', orderId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { ok: true };
}

// ============================================================
// Trust-layer photo upload — used by admin "Зураг оруулах" UI
// ============================================================

type PhotoSlot = 'prep' | 'delivery';

/**
 * Upload a fulfillment photo to Supabase Storage and write the public URL
 * back onto the order row (prep_photo_url | delivery_photo_url).
 *
 * Customer-facing order detail page reads this URL to render trust photos
 * inside the OrderTimeline component.
 */
export async function uploadOrderPhoto(
  orderId: number,
  slot: PhotoSlot,
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Зураг сонгоно уу' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'Зургийн хэмжээ 10MB-аас бага байх ёстой' };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Зөвхөн зураг upload хийнэ үү' };
  }

  const svc = createServiceClient();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const ts = Date.now();
  const key = `${orderId}/${slot}-${ts}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadErr } = await svc.storage
    .from('order-photos')
    .upload(key, bytes, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }

  const { data: pub } = svc.storage
    .from('order-photos')
    .getPublicUrl(key);
  const publicUrl = pub.publicUrl;

  const { error: updateErr } = await svc
    .from('orders')
    .update(
      slot === 'prep'
        ? { prep_photo_url: publicUrl }
        : { delivery_photo_url: publicUrl }
    )
    .eq('id', orderId);
  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true, url: publicUrl };
}

export async function removeOrderPhoto(
  orderId: number,
  slot: PhotoSlot
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { ok: false, error: 'Forbidden' };
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from('orders')
    .update(
      slot === 'prep'
        ? { prep_photo_url: null }
        : { delivery_photo_url: null }
    )
    .eq('id', orderId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}
