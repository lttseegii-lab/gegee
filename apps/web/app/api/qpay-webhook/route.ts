// QPay payment webhook
//
// QPay calls this URL when a payment status changes (typically when a customer
// completes a payment via QR scan). We verify the payment with QPay's API
// (using the invoice_id from the original create_invoice call) before marking
// the order as paid. Idempotent — handles duplicate webhook calls safely.

import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { checkInvoicePayment } from '@/lib/qpay/client';

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const orderIdParam = request.nextUrl.searchParams.get('orderId');
  if (!orderIdParam) {
    return NextResponse.json({ error: 'missing orderId' }, { status: 400 });
  }
  const orderId = parseInt(orderIdParam, 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: 'invalid orderId' }, { status: 400 });
  }

  // Service role bypasses RLS — required to update orders.status
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, qpay_invoice_id, qpay_payment_id, total')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 });
  }

  // Idempotency: already paid
  if (order.status === 'paid' || order.status === 'preparing' || order.status === 'shipped' || order.status === 'delivered') {
    return NextResponse.json({ ok: true, already_paid: true });
  }

  if (!order.qpay_invoice_id) {
    return NextResponse.json({ error: 'order has no invoice' }, { status: 400 });
  }

  // Verify payment against QPay (don't trust webhook body — trust authoritative API)
  try {
    const check = await checkInvoicePayment(order.qpay_invoice_id);
    const paid = check.rows.find((r) => r.payment_status === 'PAID');

    if (!paid) {
      return NextResponse.json({
        ok: false,
        status: 'awaiting_payment',
        count: check.count,
      });
    }

    // Mark as paid
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        qpay_payment_id: paid.payment_id,
        paid_at: paid.payment_date ?? new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Order update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, payment_id: paid.payment_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('QPay verify error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
