import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/admin/Stats';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Төлбөр',
  paid: 'Төлсөн',
  preparing: 'Бэлдэж буй',
  shipped: 'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцалсан',
  refunded: 'Буцаасан',
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-pale text-goldDeep',
  paid: 'bg-mint text-sageDeep',
  preparing: 'bg-blush text-pinkHot',
  shipped: 'bg-purpleSoft text-ink',
  delivered: 'bg-mint text-sageDeep',
  cancelled: 'bg-offwhite text-ink/50',
  refunded: 'bg-offwhite text-ink/50',
};

export default async function AdminDashboard() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    { count: todayCount },
    { count: weekCount },
    { count: newCustomersWeek },
    { count: productCount },
    { data: capacityRow },
    { data: recentOrders },
    { data: revenueWeek },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('joined_at', weekAgo),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),
    supabase.from('daily_capacity').select('*').eq('date', today).maybeSingle(),
    supabase
      .from('orders')
      .select('id, order_code, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', weekAgo)
      .in('status', ['paid', 'preparing', 'shipped', 'delivered']),
  ]);

  const revenue = (revenueWeek ?? []).reduce((s, o) => s + (o.total ?? 0), 0);
  const capMax = capacityRow?.max_orders ?? 50;
  const capUsed = capacityRow?.current_orders ?? 0;
  const capPct = capMax > 0 ? Math.round((capUsed / capMax) * 100) : 0;

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Dashboard</h1>
        <p className="text-sm text-ink/60 mt-1">
          {new Date().toLocaleDateString('mn-MN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          label="Өнөөдрийн захиалга"
          value={todayCount ?? 0}
          hint={`${weekCount ?? 0} долоо хоногт`}
        />
        <StatCard
          label="Өнөөдрийн capacity"
          value={`${capUsed} / ${capMax}`}
          hint={`${capPct}% дүүрсэн${capacityRow?.closed ? ' · Хаалттай' : ''}`}
          accent={capPct >= 80 ? 'pinkHot' : 'sageDeep'}
        />
        <StatCard
          label="7 хоногийн орлого"
          value={`${revenue.toLocaleString()}₮`}
          hint={`${revenueWeek?.length ?? 0} захиалга`}
          accent="goldDeep"
        />
        <StatCard
          label="Шинэ хэрэглэгч"
          value={newCustomersWeek ?? 0}
          hint={`Идэвхтэй продукт: ${productCount ?? 0}`}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-lg">Сүүлийн захиалга</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-ink/60 hover:text-ink"
          >
            Бүгд →
          </Link>
        </div>

        {!recentOrders || recentOrders.length === 0 ? (
          <div className="text-sm text-ink/50 bg-white border border-border rounded-card p-12 text-center">
            Захиалга байхгүй
          </div>
        ) : (
          <ul className="bg-white border border-border rounded-card overflow-hidden divide-y divide-border">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-offwhite transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm">{o.order_code}</div>
                    <span
                      className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${
                        STATUS_COLOR[o.status ?? ''] ?? 'bg-offwhite text-ink/60'
                      }`}
                    >
                      {STATUS_LABEL[o.status ?? ''] ?? o.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-sm">
                    <span className="text-ink/50 hidden sm:inline">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString('mn-MN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {o.total.toLocaleString()}₮
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
