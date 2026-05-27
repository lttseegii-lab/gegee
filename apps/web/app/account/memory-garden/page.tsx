import { createClient } from '@/lib/supabase/server';
import { MemoryDateCard, type MemoryOrder } from '@/components/account/MemoryDateCard';
import { MemoryDateAdder } from '@/components/account/MemoryDateAdder';

export const metadata = { title: 'Memory Garden' };

export default async function MemoryGardenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Auth-guarded by /account/layout.tsx; this is a defensive guard for TS
  if (!user) return null;

  // 1) All memory dates for this user
  const { data: dates } = await supabase
    .from('memory_dates')
    .select('*')
    .eq('user_id', user.id)
    .order('month')
    .order('day');

  // 2) Upcoming (next 90 days) — uses RPC
  const { data: upcoming } = await supabase.rpc('upcoming_memory_dates', {
    lookahead_days: 90,
  });
  const daysUntilMap = new Map<number, number>(
    (upcoming ?? []).map((u) => [u.id as number, u.days_until as number])
  );

  // 3) Order history per memory date — orders.memory_date_id (Phase 2)
  const dateIds = (dates ?? []).map((d) => d.id);
  const { data: linkedOrders } = dateIds.length
    ? await supabase
        .from('orders')
        .select('id, order_code, total, status, created_at, memory_date_id')
        .eq('user_id', user.id)
        .in('memory_date_id', dateIds)
        .order('created_at', { ascending: false })
    : { data: [] as MemoryOrder[] };

  const ordersByDate = new Map<number, MemoryOrder[]>();
  for (const o of (linkedOrders ?? []) as MemoryOrder[]) {
    if (o.memory_date_id == null) continue;
    const arr = ordersByDate.get(o.memory_date_id) ?? [];
    arr.push(o);
    ordersByDate.set(o.memory_date_id, arr);
  }

  // Sort: upcoming (within 90 days, asc by days_until) first, then rest by month/day
  const upcomingIds = new Set((upcoming ?? []).map((u) => u.id));
  const sorted = [...(dates ?? [])].sort((a, b) => {
    const aSoon = upcomingIds.has(a.id);
    const bSoon = upcomingIds.has(b.id);
    if (aSoon && !bSoon) return -1;
    if (!aSoon && bSoon) return 1;
    if (aSoon && bSoon) {
      return (daysUntilMap.get(a.id) ?? 0) - (daysUntilMap.get(b.id) ?? 0);
    }
    return a.month * 100 + a.day - (b.month * 100 + b.day);
  });

  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Чухал огноо
      </div>
      <h1 className="font-serif text-4xl mb-2">Memory Garden ✻</h1>
      <p className="text-sm text-ink/60 mb-8 max-w-prose">
        Хайртай хүмүүсийнхээ чухал огноог хадгална уу. Ойртохоос 7 хоног + 1
        хоног өмнө сануулга илгээж, тухайн event-д хүргүүлсэн цэцгийн түүхийг
        хадгална.
      </p>

      <section className="mb-6">
        <MemoryDateAdder />
      </section>

      {!sorted.length ? (
        <div className="text-center py-12 text-sm text-ink/50">
          Огноо нэмж эхэлнэ үү
        </div>
      ) : (
        <>
          {/* Group: Upcoming */}
          {sorted.some((d) => upcomingIds.has(d.id)) && (
            <section className="mb-10">
              <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
                Удахгүй ({sorted.filter((d) => upcomingIds.has(d.id)).length})
              </h2>
              <div className="space-y-3">
                {sorted
                  .filter((d) => upcomingIds.has(d.id))
                  .map((d) => (
                    <MemoryDateCard
                      key={d.id}
                      item={d}
                      daysUntil={daysUntilMap.get(d.id) ?? null}
                      orders={ordersByDate.get(d.id) ?? []}
                    />
                  ))}
              </div>
            </section>
          )}

          {/* Group: Rest of year */}
          {sorted.some((d) => !upcomingIds.has(d.id)) && (
            <section>
              <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
                Бусад
              </h2>
              <div className="space-y-3">
                {sorted
                  .filter((d) => !upcomingIds.has(d.id))
                  .map((d) => (
                    <MemoryDateCard
                      key={d.id}
                      item={d}
                      daysUntil={null}
                      orders={ordersByDate.get(d.id) ?? []}
                    />
                  ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink/40 mt-12 italic text-center">
        Care wildly. We&apos;re here for the little things that matter.
      </p>
    </div>
  );
}
