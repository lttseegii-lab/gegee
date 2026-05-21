/**
 * QPay v2 REST client — server-side only (uses merchant credentials).
 *
 * Docs: https://developer.qpay.mn/
 * Sandbox endpoints can be obtained from QPay merchant onboarding.
 *
 * IMPORTANT: never import this from a Client Component — QPay credentials
 * must stay on the server (or inside Supabase Edge Functions).
 */

const QPAY_BASE_URL =
  process.env.QPAY_BASE_URL ?? 'https://merchant.qpay.mn/v2';

interface QPayTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  if (!username || !password) {
    throw new Error('QPAY_USERNAME / QPAY_PASSWORD env vars missing');
  }

  const basic = Buffer.from(`${username}:${password}`).toString('base64');
  const res = await fetch(`${QPAY_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`QPay auth failed: ${res.status} ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as QPayTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export interface CreateInvoiceParams {
  orderCode: string;
  amount: number;
  description: string;
  callbackUrl: string;
}

export interface InvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG
  qPay_shortUrl: string;
  urls: Array<{ name: string; description: string; logo: string; link: string }>;
}

export async function createInvoice(
  params: CreateInvoiceParams
): Promise<InvoiceResponse> {
  const invoiceCode = process.env.QPAY_INVOICE_CODE;
  if (!invoiceCode) throw new Error('QPAY_INVOICE_CODE env var missing');

  const token = await getAccessToken();

  const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: params.orderCode,
      invoice_receiver_code: 'terminal',
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`QPay invoice failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return (await res.json()) as InvoiceResponse;
}

export interface PaymentCheckResponse {
  count: number;
  paid_amount: number;
  rows: Array<{
    payment_id: string;
    payment_status: 'NEW' | 'FAILED' | 'PAID' | 'REFUNDED';
    payment_amount: number;
    payment_date: string;
    transaction_data?: unknown;
  }>;
}

export async function checkInvoicePayment(
  invoiceId: string
): Promise<PaymentCheckResponse> {
  const token = await getAccessToken();
  const res = await fetch(`${QPAY_BASE_URL}/payment/check`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`QPay payment check failed: ${res.status}`);
  }
  return (await res.json()) as PaymentCheckResponse;
}
