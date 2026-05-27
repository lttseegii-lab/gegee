import Link from 'next/link';
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

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-pale text-ink/80',
  paid: 'bg-mint text-sageDeep',
  preparing: 'bg-peach text-goldDeep',
  shipped: 'bg-purpleSoft text-ink/80',
  delivered: 'bg-mint text-sageDeep',
  cancelled: 'bg-ink/10 text-ink/60',
  refunded: 'bg-ink/10 text-ink/60',
};

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Захиалгын түүх
      </div>
      <h1 className="font-serif text-4xl mb-2">Захиалгууд</h1>
      <p className="text-sm text-ink/60 mb-8">
        Бүх захиалгын төлөв, нийт дүн
      </p>

      {orders.length === 0 ? (
        <div className="bg-offwhite rounded-card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-ink/60 mb-6">
            Танд одоохондоо захиалга байхгүй байна
          </p>
          <Link href="/catalog/all" className="btn-primary">
            Цэцэг үзэх →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const status = o.status ?? 'pending_payment';
            return (
              <li
                key={o.id}
                className="bg-offwhite rounded-card p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{o.order_code}</div>
                  <div className="text-xs text-ink/60 mt-1">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleDateString('mn-MN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">
                    {o.total.toLocaleString()}₮
                  </div>
                  <span
                    className={`inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      STATUS_COLOR[status] ?? 'bg-ink/10 text-ink/60'
                    }`}
                  >
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
