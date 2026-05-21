import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Хэрэглэгч' };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? '';

  // Profiles
  let pq = supabase
    .from('profiles')
    .select('id, email, name, phone, provider, joined_at, role')
    .order('joined_at', { ascending: false })
    .limit(200);
  if (q) pq = pq.or(`email.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: profiles } = await pq;

  // Aggregate order stats per user (single query)
  const userIds = (profiles ?? []).map((p) => p.id);
  const { data: orderStats } = userIds.length
    ? await supabase
        .from('orders')
        .select('user_id, total, status')
        .in('user_id', userIds)
    : { data: [] };

  // Group by user_id
  const stats = new Map<string, { orders: number; spent: number }>();
  (orderStats ?? []).forEach((o) => {
    if (!o.user_id) return;
    const cur = stats.get(o.user_id) ?? { orders: 0, spent: 0 };
    cur.orders += 1;
    if (o.status === 'paid' || o.status === 'preparing' || o.status === 'shipped' || o.status === 'delivered') {
      cur.spent += o.total ?? 0;
    }
    stats.set(o.user_id, cur);
  });

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Хэрэглэгчид</h1>
        <p className="text-sm text-ink/60 mt-1">
          {profiles?.length ?? 0} нийт
        </p>
      </header>

      <form action="/admin/customers" className="mb-5 flex items-center gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Имэйл / нэр / утсаар хайх..."
          className="border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink flex-1 max-w-md"
        />
        {q && (
          <Link
            href="/admin/customers"
            className="text-xs text-ink/50 hover:text-ink"
          >
            Цэвэрлэх
          </Link>
        )}
      </form>

      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-offwhite text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="text-left px-5 py-3">Нэр</th>
              <th className="text-left px-5 py-3">Имэйл</th>
              <th className="text-left px-5 py-3">Утас</th>
              <th className="text-left px-5 py-3">Үүсгэсэн</th>
              <th className="text-right px-5 py-3">Захиалга</th>
              <th className="text-right px-5 py-3">Зарцуулсан</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(profiles ?? []).map((p) => {
              const s = stats.get(p.id) ?? { orders: 0, spent: 0 };
              return (
                <tr key={p.id} className="hover:bg-offwhite/50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/customers/${p.id}`}
                      className="font-medium hover:text-pinkHot inline-flex items-center gap-2"
                    >
                      {p.name ?? '(нэргүй)'}
                      {p.role === 'admin' && (
                        <span className="text-[9px] uppercase tracking-wider bg-yellow text-ink px-1.5 py-0.5 rounded">
                          admin
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{p.email}</td>
                  <td className="px-5 py-3 text-ink/70">{p.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-ink/70 text-xs">
                    {p.joined_at
                      ? new Date(p.joined_at).toLocaleDateString('mn-MN')
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">{s.orders}</td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {s.spent.toLocaleString()}₮
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/customers/${p.id}`}
                      className="text-ink/60 hover:text-ink text-xs"
                    >
                      Дэлгэрэнгүй →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
