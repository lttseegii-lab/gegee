// Lightweight payment-status endpoint for the checkout page poller.
//
// Default: reads the order's status from our DB only (no QPay call) — this is
// what the 3s poller hits, since QPay forbids constantly hitting payment/check.
// With `?verify=1`: forces a single authoritative QPay check (used as a slow
// fallback for a missed callback and by the manual "I've paid" button).

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { confirmOrderPayment } from '@/lib/qpay/confirm';

const PAID_STATUSES = ['paid', 'preparing', 'shipped', 'delivered'];
const isPaid = (s: string | null) => !!s && PAID_STATUSES.includes(s);

export async function GET(request: NextRequest) {
  const orderId = parseInt(request.nextUrl.searchParams.get('orderId') ?? '', 10);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: 'invalid orderId' }, { status: 400 });
  }
  const verify = request.nextUrl.searchParams.get('verify') === '1';

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // RLS owner-select: the user can only read their own order.
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();
  if (!order) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (isPaid(order.status)) {
    return NextResponse.json({ paid: true, status: order.status });
  }

  if (verify) {
    try {
      const r = await confirmOrderPayment(orderId);
      return NextResponse.json({ paid: r.paid, status: r.status });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('QPay status verify error:', msg);
      return NextResponse.json({ paid: false, status: order.status, error: msg });
    }
  }

  return NextResponse.json({ paid: false, status: order.status });
}
