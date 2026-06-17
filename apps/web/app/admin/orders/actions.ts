'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/auth/admin';
import { signOrderPhoto } from '@/lib/storage/orderPhotos';
import { sendSms } from '@/lib/sms/callpro';
import { orderStatusSms } from '@/lib/sms/templates';
import type { OrderStatus } from '@/types/database';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // No manual pending_payment → paid: payment must be confirmed through QPay
  // (which credits rewards + issues the e-receipt). Admins can only cancel.
  pending_payment: ['cancelled'],
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

  const { data: order, error } = await svc
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select('order_code, user_id')
    .single();
  if (error) return { error: error.message };

  // Send SMS notification (fire-and-forget — don't block the response)
  const message = orderStatusSms(order.order_code ?? '', next);
  if (message && order.user_id) {
    const { data: profile } = await svc
      .from('profiles')
      .select('phone')
      .eq('id', order.user_id)
      .single();

    const phone = profile?.phone;
    if (phone) {
      const result = await sendSms(phone, message);
      await svc.from('sms_log').insert({
        phone,
        message,
        type:   'order_status',
        ref_id: String(orderId),
        ok:     result.ok,
        error:  result.error ?? null,
      });
    }
  }

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

  // Store the object KEY (not a public URL). The bucket is private (0022) and
  // reads go through short-lived signed URLs (lib/storage/orderPhotos.ts).
  const { error: updateErr } = await svc
    .from('orders')
    .update(
      slot === 'prep' ? { prep_photo_url: key } : { delivery_photo_url: key }
    )
    .eq('id', orderId);
  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  const signedUrl = await signOrderPhoto(key);
  return { ok: true, url: signedUrl ?? undefined };
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
