import Link from 'next/link';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createInvoice } from '@/lib/qpay/client';
import { PaymentPoller } from '@/components/checkout/PaymentPoller';

export const metadata = { title: 'Төлбөр төлөх' };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = parseInt(searchParams.orderId ?? '', 10);
  if (!orderId || isNaN(orderId)) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch order
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_code, total, status, qpay_invoice_id, address_id, notes')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();

  // Already paid
  if (order.status === 'paid' || order.status === 'preparing' || order.status === 'shipped' || order.status === 'delivered') {
    redirect(`/checkout/success?orderCode=${order.order_code}`);
  }

  // Create or reuse QPay invoice
  let invoiceData: {
    qr_image: string;
    qPay_shortUrl: string;
    urls: Array<{ name: string; logo: string; link: string }>;
  } | null = null;
  let qpayError: string | null = null;

  if (!process.env.QPAY_USERNAME || !process.env.QPAY_PASSWORD) {
    qpayError = 'QPAY_USERNAME/QPAY_PASSWORD тохируулагдаагүй байна. .env.local-д нэмнэ үү.';
  } else {
    try {
      const invoice = await createInvoice({
        orderCode: order.order_code ?? `ORDER-${order.id}`,
        amount: order.total,
        description: `Gegeen захиалга ${order.order_code}`,
        callbackUrl: `${SITE_URL}/api/qpay-webhook?orderId=${order.id}`,
      });

      // Persist invoice_id back to order (idempotent — only set if null)
      if (!order.qpay_invoice_id) {
        await supabase
          .from('orders')
          .update({ qpay_invoice_id: invoice.invoice_id })
          .eq('id', order.id);
      }

      invoiceData = {
        qr_image: invoice.qr_image,
        qPay_shortUrl: invoice.qPay_shortUrl,
        urls: invoice.urls,
      };
    } catch (e) {
      qpayError = e instanceof Error ? e.message : String(e);
      console.error('QPay invoice creation failed:', qpayError);
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
        </>
      ) : (
        <div className="text-ink/60">Invoice ачаалж байна…</div>
      )}

      <Link href={`/account/orders`} className="text-sm text-ink/60 hover:text-ink">
        Дараа төлнө
      </Link>

      <div className="mt-10 text-xs text-ink/40 border-t border-border pt-6">
        💡 Төлбөр төлөгдмөгц энэ хуудас автоматаар success руу шилжинэ
        (webhook implementation Sprint 4-ийн дараагийн алхамд).
      </div>
    </main>
  );
}
