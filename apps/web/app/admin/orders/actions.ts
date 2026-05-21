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
