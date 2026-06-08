/**
 * Authoritative "is this order paid?" check, shared by the QPay callback and the
 * on-demand verify endpoint. Never trusts the caller — it asks QPay's payment/check
 * API and updates the order with the service-role client (orders updates are
 * RLS-restricted to service_role). Idempotent: the rewards trigger only credits on
 * the pending_payment → paid transition, and qpay_payment_id has a unique index.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { checkInvoicePayment, createEbarimt } from '@/lib/qpay/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const PAID_STATUSES = ['paid', 'preparing', 'shipped', 'delivered'];

/**
 * Best-effort Ebarimt 3.0 e-receipt creation. Never throws — e-receipts require
 * QPay to enable the setting for the merchant, so a failure here must not affect
 * the (already confirmed) payment. Stores a small subset on the order.
 */
async function tryCreateEbarimt(
  supabase: SupabaseClient,
  orderId: number,
  paymentId: string
): Promise<void> {
  if (process.env.QPAY_EBARIMT_ENABLED === 'false') return;
  try {
    const e = await createEbarimt({ paymentId, receiverType: 'CITIZEN' });
    await supabase
      .from('orders')
      .update({
        qpay_ebarimt: {
          id: e.id,
          lottery: e.ebarimt_lottery ?? null,
          qr_data: e.ebarimt_qr_data ?? null,
          receipt_id: e.ebarimt_receipt_id ?? null,
          status: e.barimt_status ?? e.ebarimt_status ?? null,
          created_at: new Date().toISOString(),
        },
      })
      .eq('id', orderId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `Ebarimt skipped for order ${orderId} (may need QPay activation):`,
      msg
    );
  }
}

export type ConfirmReason =
  | 'already_paid'
  | 'confirmed'
  | 'awaiting'
  | 'no_invoice'
  | 'not_found'
  | 'error';

export interface ConfirmResult {
  paid: boolean;
  status: string | null;
  reason: ConfirmReason;
  paymentId?: string;
}

export async function confirmOrderPayment(
  orderId: number
): Promise<ConfirmResult> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, qpay_invoice_id')
    .eq('id', orderId)
    .single();

  if (!order) return { paid: false, status: null, reason: 'not_found' };

  if (order.status && PAID_STATUSES.includes(order.status)) {
    return { paid: true, status: order.status, reason: 'already_paid' };
  }

  if (!order.qpay_invoice_id) {
    return { paid: false, status: order.status, reason: 'no_invoice' };
  }

  const check = await checkInvoicePayment(order.qpay_invoice_id);
  const paidRow = check.rows.find((r) => r.payment_status === 'PAID');
  if (!paidRow) {
    return { paid: false, status: order.status, reason: 'awaiting' };
  }

  const paymentId = String(paidRow.payment_id);
  // Conditional flip: only the call that transitions pending_payment → paid gets
  // a row back, so the e-receipt is created exactly once even under concurrent
  // callback + poll calls.
  const { data: flipped, error } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      qpay_payment_id: paymentId,
      paid_at: paidRow.payment_date ?? new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending_payment')
    .select('id');

  if (error) {
    // e.g. a concurrent flip recorded the same payment first. Still genuinely paid.
    console.error('QPay confirm update error:', error.message);
    return { paid: true, status: 'paid', reason: 'confirmed', paymentId };
  }

  if (flipped && flipped.length === 1) {
    await tryCreateEbarimt(supabase, orderId, paymentId);
    return { paid: true, status: 'paid', reason: 'confirmed', paymentId };
  }

  // 0 rows updated → another concurrent call already flipped it (it handles the
  // receipt), or the order wasn't pending. The payment is paid either way.
  return { paid: true, status: 'paid', reason: 'already_paid', paymentId };
}
