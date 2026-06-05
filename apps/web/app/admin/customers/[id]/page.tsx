import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();
  if (!profile) notFound();

  const [
    { data: addresses },
    { data: orders },
    { data: rewards },
    { data: memoryDates },
  ] = await Promise.all([
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', params.id)
      .order('is_default', { ascending: false }),
    supabase
      .from('orders')
      .select('id, order_code, total, status, created_at')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_rewards')
      .select('total_points, total_spent, tier')
      .eq('user_id', params.id)
      .maybeSingle(),
    supabase
      .from('memory_dates')
      .select('id, name, month, day, occasion, reminders_enabled')
      .eq('user_id', params.id)
      .order('month')
      .order('day'),
  ]);

  const totalSpent = (orders ?? [])
    .filter((o) => ['paid', 'preparing', 'shipped', 'delivered'].includes(o.status ?? ''))
    .reduce((s, o) => s + (o.total ?? 0), 0);
  const avgOrder =
    (orders ?? []).length > 0
      ? Math.round(totalSpent / (orders ?? []).length)
      : 0;

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin/customers" className="hover:text-ink">Хэрэглэгчид</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">{profile.name ?? profile.email}</span>
      </nav>

      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif italic text-3xl flex items-center gap-3">
            {profile.name ?? '(нэргүй)'}
            {profile.role === 'admin' && (
              <span className="text-[10px] uppercase tracking-wider bg-yellow text-ink px-2 py-1 rounded">
                admin
              </span>
            )}
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            {profile.email} · {profile.phone ?? 'утас байхгүй'}
          </p>
          <p className="text-xs text-ink/50 mt-1">
            {profile.provider ?? 'email'} · Үүсгэсэн{' '}
            {profile.joined_at
              ? new Date(profile.joined_at).toLocaleDateString('mn-MN')
              : '—'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-ink/40">
            Нийт зарцуулсан
          </div>
          <div className="text-2xl font-serif italic text-goldDeep mt-1">
            {totalSpent.toLocaleString()}₮
          </div>
          <div className="text-xs text-ink/50 mt-1">
            {(orders ?? []).length} захиалга · {avgOrder.toLocaleString()}₮ дундаж
          </div>
          {rewards && (
            <div className="text-xs text-ink/60 mt-2">
              {rewards.tier} tier · {(rewards.total_points ?? 0).toLocaleString()} оноо
              {' · '}
              <Link
                href={`/admin/rewards/${params.id}`}
                className="text-pinkHot hover:underline"
              >
                Удирдах →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Orders */}
      <section className="mb-10">
        <h2 className="font-medium text-lg mb-4">Захиалгын түүх</h2>
        {!orders || orders.length === 0 ? (
          <div className="bg-white border border-border rounded-card p-10 text-center text-sm text-ink/50">
            Захиалга байхгүй
          </div>
        ) : (
          <div className="bg-white border border-border rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-offwhite text-xs uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="text-left px-5 py-3">Order code</th>
                  <th className="text-left px-5 py-3">Огноо</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Дүн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-offwhite/50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono hover:text-pinkHot"
                      >
                        {o.order_code}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink/70 text-xs">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleString('mn-MN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded ${
                          STATUS_COLOR[o.status ?? ''] ?? 'bg-offwhite text-ink/60'
                        }`}
                      >
                        {STATUS_LABEL[o.status ?? ''] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {o.total.toLocaleString()}₮
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Memory Garden */}
      {memoryDates && memoryDates.length > 0 && (
        <section className="mb-10">
          <h2 className="font-medium text-lg mb-4">
            Мартаж болохгүй өдрүүд ({memoryDates.length})
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {memoryDates.map((m) => (
              <li
                key={m.id}
                className="bg-white border border-border rounded-card p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs text-ink/40">
                    {m.month}/{m.day}
                  </span>
                </div>
                <div className="text-xs text-ink/60 mt-1">
                  {m.occasion}
                  {!m.reminders_enabled && ' · 🔕'}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Addresses */}
      <section>
        <h2 className="font-medium text-lg mb-4">
          Хадгалсан хаягууд ({addresses?.length ?? 0})
        </h2>
        {!addresses || addresses.length === 0 ? (
          <p className="text-sm text-ink/50">Хаяг байхгүй</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {addresses.map((a) => (
              <li
                key={a.id}
                className="bg-white border border-border rounded-card p-4 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{a.label}</span>
                  {a.is_default && (
                    <span className="text-[10px] uppercase bg-mint text-ink px-2 py-0.5 rounded">
                      үндсэн
                    </span>
                  )}
                </div>
                <div className="text-ink/70 text-xs">
                  {a.recipient} · {a.phone}
                </div>
                <div className="text-ink/60 text-xs mt-1">
                  {[a.city, a.district, a.khoroo, a.building]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {(a.entrance || a.floor || a.unit) && (
                  <div className="text-ink/60 text-xs">
                    {[
                      a.entrance && `${a.entrance} орц`,
                      a.floor && `${a.floor} давхар`,
                      a.unit && `${a.unit} тоот`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
