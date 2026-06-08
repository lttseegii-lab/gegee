/**
 * QPay v2 REST client — server-side only (uses merchant credentials).
 *
 * Docs: https://developer.qpay.mn/  (V2 API with Ebarimt 3.0)
 * Endpoints: https://merchant.qpay.mn/v2 (prod) / https://merchant-sandbox.qpay.mn/v2
 *
 * IMPORTANT: never import this from a Client Component — QPay credentials
 * must stay on the server.
 *
 * Token handling: QPay's auth response field `expires_in` is an ABSOLUTE Unix
 * timestamp (epoch *seconds*), NOT a relative duration. QPay explicitly forbids
 * requesting tokens repeatedly, so we cache the access token both in-memory and
 * in the `qpay_token` table (shared across serverless instances) and only mint a
 * new one once the cached token is within `TOKEN_SAFETY_MS` of its expiry.
 */

import { createServiceClient } from '@/lib/supabase/server';

const QPAY_BASE_URL =
  process.env.QPAY_BASE_URL ?? 'https://merchant.qpay.mn/v2';

// Refresh a bit before the real expiry to avoid races at the boundary.
const TOKEN_SAFETY_MS = 60_000;

interface QPayTokenResponse {
  access_token: string;
  refresh_token: string;
  /** Absolute expiry as a Unix timestamp in seconds (NOT a duration). */
  expires_in: number;
  token_type: string;
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;
// Dedupe concurrent mints within a single server instance.
let inflight: Promise<string> | null = null;

async function readTokenFromDb(): Promise<CachedToken | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('qpay_token')
      .select('access_token, expires_at')
      .eq('id', true)
      .maybeSingle();
    if (error || !data) return null;
    return {
      token: data.access_token,
      expiresAtMs: new Date(data.expires_at).getTime(),
    };
  } catch {
    // Table may not exist yet (migration 0018 not run) — fall back to in-memory.
    return null;
  }
}

async function writeTokenToDb(t: CachedToken): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('qpay_token').upsert({
      id: true,
      access_token: t.token,
      expires_at: new Date(t.expiresAtMs).toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Best-effort; the in-memory cache still prevents repeated requests.
  }
}

async function mintToken(): Promise<string> {
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
  // `expires_in` is an absolute epoch (seconds) → milliseconds.
  const token: CachedToken = {
    token: data.access_token,
    expiresAtMs: data.expires_in * 1000,
  };
  cachedToken = token;
  await writeTokenToDb(token);
  return token.token;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + TOKEN_SAFETY_MS) {
    return cachedToken.token;
  }

  if (!inflight) {
    inflight = (async () => {
      try {
        // Another instance may have already minted a token — reuse it.
        const fromDb = await readTokenFromDb();
        if (fromDb && fromDb.expiresAtMs > Date.now() + TOKEN_SAFETY_MS) {
          cachedToken = fromDb;
          return fromDb.token;
        }
        return await mintToken();
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

export interface CreateInvoiceParams {
  /** Our unique reference for this invoice (special chars are stripped). */
  senderInvoiceNo: string;
  amount: number;
  description: string;
  callbackUrl: string;
  receiver?: {
    register?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface InvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG (no data: prefix)
  qPay_shortUrl: string;
  urls: Array<{ name: string; description: string; logo: string; link: string }>;
}

export async function createInvoice(
  params: CreateInvoiceParams
): Promise<InvoiceResponse> {
  const invoiceCode = process.env.QPAY_INVOICE_CODE;
  if (!invoiceCode) throw new Error('QPAY_INVOICE_CODE env var missing');

  const token = await getAccessToken();

  // QPay: sender_invoice_no must not contain special characters.
  const senderInvoiceNo = params.senderInvoiceNo.replace(/[^a-zA-Z0-9]/g, '');

  const body: Record<string, unknown> = {
    invoice_code: invoiceCode,
    sender_invoice_no: senderInvoiceNo,
    invoice_receiver_code: 'terminal',
    invoice_description: params.description.slice(0, 255),
    amount: params.amount,
    callback_url: params.callbackUrl,
  };
  if (params.receiver) {
    body.invoice_receiver_data = params.receiver;
  }

  const res = await fetch(`${QPAY_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`QPay invoice failed: ${res.status} ${errBody.slice(0, 300)}`);
  }
  return (await res.json()) as InvoiceResponse;
}

export interface PaymentRow {
  payment_id: string;
  payment_status: 'NEW' | 'FAILED' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  payment_amount: number | string;
  payment_date?: string;
  payment_wallet?: string;
  payment_type?: string;
}

export interface PaymentCheckResponse {
  count: number;
  paid_amount?: number;
  rows: PaymentRow[];
}

/**
 * Verify whether an invoice has been paid. Call this from the QPay callback
 * (or an on-demand "check now") — never on a constant cron, which QPay forbids.
 */
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
    const errBody = await res.text().catch(() => '');
    throw new Error(`QPay payment check failed: ${res.status} ${errBody.slice(0, 200)}`);
  }
  return (await res.json()) as PaymentCheckResponse;
}

export interface EbarimtResponse {
  id: string;
  ebarimt_lottery?: string;
  ebarimt_qr_data?: string;
  ebarimt_receipt_id?: string;
  barimt_status?: string;
  ebarimt_status?: string;
  [k: string]: unknown;
}

/**
 * Create an Ebarimt 3.0 e-receipt for a completed payment (Mongolian tax receipt).
 * Endpoint: /v2/ebarimt_v3/create.
 *
 * NOTE: QPay must activate e-receipt settings for the merchant first — otherwise
 * this call fails. Call it best-effort after a payment is confirmed so a missing
 * activation never blocks the order.
 */
export async function createEbarimt(params: {
  paymentId: string;
  receiverType?: 'CITIZEN' | 'COMPANY';
  /** Citizen: phone registered in the e-barimt app; Company: registration no. */
  receiver?: string;
}): Promise<EbarimtResponse> {
  const token = await getAccessToken();
  const body: Record<string, unknown> = {
    payment_id: params.paymentId,
    ebarimt_receiver_type: params.receiverType ?? 'CITIZEN',
  };
  if (params.receiver) body.ebarimt_receiver = params.receiver;

  const res = await fetch(`${QPAY_BASE_URL}/ebarimt_v3/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`QPay ebarimt create failed: ${res.status} ${errBody.slice(0, 300)}`);
  }
  return (await res.json()) as EbarimtResponse;
}
