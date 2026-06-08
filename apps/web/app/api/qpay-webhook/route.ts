// QPay payment callback
//
// QPay calls this URL (HTTP GET) when a payment is made, appending
// `qpay_payment_id` to the callback_url we registered on the invoice
// (which already carries our `?orderId=`). We DON'T trust the callback body —
// we verify against QPay's payment/check API and mark the order paid.
//
// QPay requires the callback to respond with HTTP 200 and a plain-text body of
// exactly `SUCCESS`. Any other body is prohibited. We return SUCCESS only once
// the payment is verified + recorded; otherwise we return a non-200 so QPay
// retries (e.g. a brief race where check() lags the callback).

import { type NextRequest } from 'next/server';
import { confirmOrderPayment } from '@/lib/qpay/confirm';

const ok = () =>
  new Response('SUCCESS', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });

const retry = (msg: string, status = 409) =>
  new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const orderIdParam = request.nextUrl.searchParams.get('orderId');
  const orderId = parseInt(orderIdParam ?? '', 10);
  if (!orderIdParam || isNaN(orderId)) {
    return retry('MISSING_ORDER_ID', 400);
  }

  try {
    const result = await confirmOrderPayment(orderId);
    if (result.paid) return ok();

    // Not yet paid / not found — let QPay retry.
    const status = result.reason === 'not_found' ? 404 : 409;
    return retry(result.reason.toUpperCase(), status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('QPay callback error:', msg);
    return retry('ERROR', 500);
  }
}
