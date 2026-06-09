import Link from 'next/link';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireOnboarded } from '@/lib/auth/requireOnboarding';
import { createInvoice, type InvoiceResponse } from '@/lib/qpay/client';
import { PaymentPoller } from '@/components/checkout/PaymentPoller';
import { CheckPaymentButton } from '@/components/checkout/CheckPaymentButton';

export const metadata = { title: 'Төлбөр төлөх' };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const PAID_STATUSES = ['paid', 'preparing', 'shipped', 'delivered'];

// Subset of the QPay invoice we cache on the order for display + reuse.
type StoredInvoice = {
  qr_image: string;
  qPay_shortUrl: string;
  urls: InvoiceResponse['urls'];
};

type OrderRow = {
  id: number;
  order_code: string | null;
  total: number;
  status: string | null;
  qpay_invoice_id: string | null;
  qpay_invoice?: unknown;
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = parseInt(searchParams.orderId ?? '', 10);
  if (!orderId || isNaN(orderId)) notFound();

  const supabase = createClient();
  // Defense in depth: reaching payment requires a created order (which already
  // passes the checkout gate), but enforce the onboarding gate here too.
  const user = await requireOnboarded('/checkout');

  // Fetch order. `qpay_invoice` is added by migration 0018 — if it isn't applied
  // yet the rich select errors, so fall back to the base columns gracefully.
  let order: OrderRow | null = null;
  let cached: StoredInvoice | null = null;
  const rich = await supabase
    .from('orders')
    .select('id, order_code, total, status, qpay_invoice_id, qpay_invoice')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (rich.error) {
    const basic = await supabase
      .from('orders')
      .select('id, order_code, total, status, qpay_invoice_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();
    order = basic.data as OrderRow | null;
  } else {
    order = rich.data as OrderRow | null;
    if (order?.qpay_invoice && typeof order.qpay_invoice === 'object') {
      cached = order.qpay_invoice as StoredInvoice;
    }
  }

  if (!order) notFound();

  // Already paid
  if (order.status && PAID_STATUSES.includes(order.status)) {
    redirect(`/checkout/success?orderCode=${order.order_code}`);
  }

  // Reuse the cached invoice on reload; otherwise create one and persist it.
  let invoiceData: StoredInvoice | null =
    cached && cached.qr_image ? cached : null;
  let qpayError: string | null = null;

  if (!invoiceData) {
    if (!process.env.QPAY_USERNAME || !process.env.QPAY_PASSWORD) {
      qpayError =
        'QPAY_USERNAME/QPAY_PASSWORD тохируулагдаагүй байна. .env.local-д нэмнэ үү.';
    } else {
      try {
        const invoice = await createInvoice({
          senderInvoiceNo: String(order.id),
          amount: order.total,
          description: `Thanks захиалга ${order.order_code}`,
          callbackUrl: `${SITE_URL}/api/qpay-webhook?orderId=${order.id}`,
        });

        invoiceData = {
          qr_image: invoice.qr_image,
          qPay_shortUrl: invoice.qPay_shortUrl,
          urls: invoice.urls,
        };

        // Persist with the service-role client — orders updates are RLS-restricted
        // to service_role (the QPay callback also updates via service role).
        const admin = createServiceClient();
        const upd = await admin
          .from('orders')
          .update({
            qpay_invoice_id: invoice.invoice_id,
            qpay_invoice: invoiceData,
          })
          .eq('id', order.id);
        if (upd.error) {
          // qpay_invoice column may not exist yet — at least persist the id so
          // the callback can verify the payment.
          await admin
            .from('orders')
            .update({ qpay_invoice_id: invoice.invoice_id })
            .eq('id', order.id);
        }
      } catch (e) {
        qpayError = e instanceof Error ? e.message : String(e);
        console.error('QPay invoice creation failed:', qpayError);
      }
    }
  }

  return (
    <main className="max-w-md mx-auto px-6 py-12 text-center">
      {invoiceData && order.order_code && (
        <PaymentPoller orderId={order.id} orderCode={order.order_code} />
      )}
      <nav className="text-[13px] text-ink/60 mb-6 flex items-center justify-center gap-2">
        <Link href="/" className="hover:text-ink">Нүүр</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Төлбөр</span>
      </nav>

      <h1 className="font-serif italic text-3xl mb-2">Төлбөр төлөх</h1>
      <p className="text-sm text-ink/60 mb-1">
        Захиалгын дугаар: <span className="font-mono text-ink">{order.order_code}</span>
      </p>
      <p className="text-2xl font-semibold mt-3 mb-8">
        {order.total.toLocaleString()}₮
      </p>

      {qpayError ? (
        <div className="border border-pinkHot/40 bg-blush rounded-card p-6 text-sm text-ink/80 text-left">
          <p className="font-medium mb-2">⚠️ Төлбөрийн систем бэлэн биш байна</p>
          <p className="text-ink/60 mb-3">{qpayError}</p>
          <p className="text-xs text-ink/50">
            Та .env.local-д QPay merchant credentials-ийг нэмж дараа дахин оролдоно уу.
          </p>
        </div>
      ) : invoiceData ? (
        <>
          <div className="bg-white border border-border rounded-card p-6 mb-6">
            <Image
              src={`data:image/png;base64,${invoiceData.qr_image}`}
              alt="QPay QR код"
              width={280}
              height={280}
              className="mx-auto rounded"
              unoptimized
            />
            <p className="text-xs text-ink/60 mt-4">
              Банкны аппликейшнаараа дээрх QR-г уншуулна уу
            </p>
          </div>

          {invoiceData.urls && invoiceData.urls.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-ink/40 mb-3">
                Эсвэл шууд аппаар нээх
              </p>
              <div className="grid grid-cols-3 gap-2">
                {invoiceData.urls.slice(0, 6).map((u) => (
                  <a
                    key={u.name}
                    href={u.link}
                    className="border border-border rounded-lg p-2 text-xs hover:border-ink"
                  >
                    {u.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <a
            href={invoiceData.qPay_shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full mb-3"
          >
            QPay аппаар нээх →
          </a>

          {order.order_code && (
            <CheckPaymentButton orderId={order.id} orderCode={order.order_code} />
          )}
        </>
      ) : (
        <div className="text-ink/60">Invoice ачаалж байна…</div>
      )}

      <Link href={`/account/orders`} className="text-sm text-ink/60 hover:text-ink">
        Дараа төлнө
      </Link>

      <div className="mt-10 text-xs text-ink/40 border-t border-border pt-6">
        💡 Төлбөр төлөгдмөгц энэ хуудас автоматаар баталгаажуулалтын хуудас руу шилжинэ.
      </div>
    </main>
  );
}
