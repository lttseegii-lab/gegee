import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { OrderRow } from '@/types/database';

export const metadata = { title: 'Захиалгууд' };

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Төлбөр хүлээж байна',
  paid: 'Төлбөр төлөгдсөн',
  preparing: 'Бэлдэж байна',
  shipped: 'Хүргэлтэнд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаасан',
};

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/orders');

  const { data } = await supabase
    .from('orders')
    .select('id, order_code, total, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const orders = (data ?? []) as Pick<
    OrderRow,
    'id' | 'order_code' | 'total' | 'status' | 'created_at'
  >[];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-serif italic text-4xl mb-8">Захиалгууд</h1>

      {orders.length === 0 ? (
        <div className="border border-border rounded-card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-ink/60 mb-6">Танд одоохондоо захиалга байхгүй байна</p>
          <Link href="/catalog/all" className="btn-primary">
            Цэцэг үзэх →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="border border-border rounded-card p-5 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-sm">{o.order_code}</div>
                <div className="text-xs text-ink/60 mt-1">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString('mn-MN') : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {o.total.toLocaleString()}₮
                </div>
                <div className="text-xs text-ink/60 mt-1">
                  {STATUS_LABEL[o.status ?? 'pending_payment'] ?? o.status ?? '—'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
