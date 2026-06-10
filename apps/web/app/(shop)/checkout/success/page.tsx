import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Захиалга баталгаажлаа' };

const PAID_STATUSES = ['paid', 'preparing', 'shipped', 'delivered'];

// Server component: never assert "paid" without verifying the order is real,
// owned by the viewer, and actually in a paid state — otherwise a non-payer
// hitting /checkout/success?orderCode=… would be falsely told they paid.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderCode?: string };
}) {
  const code = searchParams.orderCode;
  if (!code) redirect('/account/orders');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/orders');

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_code, total, status, delivery_date, qpay_ebarimt'
    )
    .eq('order_code', code)
    .eq('user_id', user.id)
    .maybeSingle();

  // Unknown / not-yours → don't claim success.
  if (!order) redirect('/account/orders');
  // Not actually paid → route to payment instead of a false confirmation.
  if (!order.status || !PAID_STATUSES.includes(order.status)) {
    redirect(`/checkout/payment?orderId=${order.id}`);
  }

  const ebarimt = order.qpay_ebarimt as
    | { lottery?: string | null; status?: string | null }
    | null;

  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="text-6xl mb-6">🌸</div>
      <h1 className="font-serif italic text-3xl mb-3">Баярлалаа!</h1>
      <p className="text-ink/70 mb-2">
        Төлбөр амжилттай хийгдэж, захиалга баталгаажлаа.
      </p>
      <p className="text-sm text-ink/50 mb-2">
        Захиалгын дугаар:{' '}
        <span className="font-mono text-ink">{order.order_code}</span>
      </p>
      <p className="text-2xl font-serif italic mb-8">
        {order.total.toLocaleString()}₮
      </p>

      {(order.delivery_date || ebarimt?.lottery) && (
        <div className="bg-white border border-border rounded-card p-5 mb-8 text-sm text-ink/80 text-left space-y-2">
          {order.delivery_date && (
            <div className="flex justify-between">
              <span className="text-ink/60">Хүргэх өдөр</span>
              <span className="font-medium">
                {new Date(order.delivery_date).toLocaleDateString('mn-MN', {
                  dateStyle: 'long',
                })}
              </span>
            </div>
          )}
          {ebarimt?.lottery && (
            <div className="flex justify-between">
              <span className="text-ink/60">И-баримт сугалаа</span>
              <span className="font-mono">{ebarimt.lottery}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-mint/30 rounded-card p-5 mb-8 text-sm text-ink/80">
        💐 <strong>Дараагийн алхам:</strong> Бид таны цэцгийг бэлтгэж эхэллээ.
        Хүргэлтийн явцыг захиалгын хуудаснаас хянах боломжтой.
      </div>

      <div className="space-y-3">
        <Link href={`/account/orders/${order.id}`} className="btn-primary w-full">
          Захиалгаа харах →
        </Link>
        <Link href="/" className="btn-ghost w-full">
          Нүүр хуудас
        </Link>
      </div>
    </main>
  );
}
