import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/database';

export const metadata = { title: 'Захиалга' };

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

const RANGE_LABEL: Record<string, string> = {
  today: 'Өнөөдөр',
  week: 'Энэ долоо хоног',
  all: 'Бүгд',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; range?: string; q?: string };
}) {
  const supabase = createClient();

  const statusFilter = searchParams.status as OrderStatus | undefined;
  const range = searchParams.range ?? 'all';
  const q = searchParams.q?.trim() ?? '';

  let query = supabase
    .from('orders')
    .select('id, order_code, total, status, created_at, address_id, notes')
    .order('created_at', { ascending: false })
    .limit(200);

  if (statusFilter) query = query.eq('status', statusFilter);

  if (range === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte('created_at', today);
  } else if (range === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    query = query.gte('created_at', weekAgo);
  }

  if (q) query = query.ilike('order_code', `%${q}%`);

  const { data: orders } = await query;

  // Counts per status (for chip badges) — single query, group client-side
  const { data: allByStatus } = await supabase
    .from('orders')
    .select('status');
  const counts: Record<string, number> = {};
  (allByStatus ?? []).forEach((r) => {
    const s = r.status ?? 'pending_payment';
    counts[s] = (counts[s] ?? 0) + 1;
  });
  const totalCount = (allByStatus ?? []).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Захиалга</h1>
        <p className="text-sm text-ink/60 mt-1">
          Шүүлтүүр идэвхтэй: {RANGE_LABEL[range]} · {orders?.length ?? 0} илэрц
        </p>
      </header>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
        <FilterChip
          href={buildHref(searchParams, { status: undefined })}
          active={!statusFilter}
          label="Бүгд"
          count={totalCount}
        />
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <FilterChip
            key={s}
            href={buildHref(searchParams, { status: s })}
            active={statusFilter === s}
            label={STATUS_LABEL[s]}
            count={counts[s] ?? 0}
            color={STATUS_COLOR[s]}
          />
        ))}
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-3 mb-6 text-sm">
        {(['all', 'today', 'week'] as const).map((r) => (
          <Link
            key={r}
            href={buildHref(searchParams, { range: r })}
            className={`px-3 py-1.5 rounded-full text-[12px] transition-colors ${
              range === r
                ? 'bg-ink text-white'
                : 'border border-border text-ink/60 hover:border-ink'
            }`}
          >
            {RANGE_LABEL[r]}
          </Link>
        ))}
        <form action="/admin/orders" className="ml-auto">
          <input
            type="hidden"
            name="status"
            value={searchParams.status ?? ''}
          />
          <input type="hidden" name="range" value={range} />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="GG-260521-…"
            className="border border-border rounded-full px-4 py-1.5 text-[12px] focus:outline-none focus:border-ink w-48"
          />
        </form>
      </div>

      {/* Table */}
      {!orders || orders.length === 0 ? (
        <div className="bg-white border border-border rounded-card p-16 text-center text-ink/50">
          Захиалга олдсонгүй
        </div>
      ) : (
        <div className="bg-white border border-border rounded-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-offwhite text-xs uppercase tracking-wider text-ink/60">
              <tr>
                <th className="text-left px-5 py-3">Order code</th>
                <th className="text-left px-5 py-3">Огноо</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Дүн</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-offwhite/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-ink hover:text-pinkHot"
                    >
                      {o.order_code}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink/70">
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
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-ink/60 hover:text-ink text-xs"
                    >
                      Дэлгэрэнгүй →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
  color,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap transition-colors flex-shrink-0 ${
        active
          ? color ?? 'bg-ink text-white'
          : 'border border-border text-ink/60 hover:border-ink'
      }`}
    >
      {label}
      <span className={active ? 'opacity-70' : 'text-ink/40'}>{count}</span>
    </Link>
  );
}

function buildHref(
  current: { status?: string; range?: string; q?: string },
  patch: Partial<{ status?: string; range?: string; q?: string }>
): string {
  const merged = { ...current, ...patch };
  const sp = new URLSearchParams();
  if (merged.status) sp.set('status', merged.status);
  if (merged.range && merged.range !== 'all') sp.set('range', merged.range);
  if (merged.q) sp.set('q', merged.q);
  const qs = sp.toString();
  return qs ? `/admin/orders?${qs}` : '/admin/orders';
}
