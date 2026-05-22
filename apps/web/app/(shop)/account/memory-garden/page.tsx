import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MemoryDateCard } from '@/components/account/MemoryDateCard';
import { MemoryDateAdder } from '@/components/account/MemoryDateAdder';
import { formatMonthDay } from '@/lib/memory/occasions';
import type { MemoryDate, Product } from '@/types/database';

export const metadata = { title: 'Memory Garden' };

export default async function MemoryGardenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/memory-garden');

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

  // 3) Hydrate AI-suggested products
  const productIds = Array.from(
    new Set((dates ?? []).map((d) => d.ai_suggested_product_id).filter(Boolean))
  ) as string[];

  const { data: products } = productIds.length
    ? await supabase
        .from('products')
        .select('id, name, price, img_seed, img_prompt, img_url')
        .in('id', productIds)
    : { data: [] };
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

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
    <main className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/account/profile" className="hover:text-ink">
          Хувийн мэдээлэл
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Memory Garden</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Memory Garden ✻</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-prose">
          Хайртай хүмүүсийнхээ чухал огноог хадгална уу. AI цэцэг ойртохоос
          7 хоног + 1 хоног өмнө сануулга илгээж, тэр хүний дургуйц цэцгийг санал болгоно.
        </p>
      </header>

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
                      suggestion={
                        d.ai_suggested_product_id
                          ? productMap.get(d.ai_suggested_product_id) ?? null
                          : null
                      }
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
                      suggestion={
                        d.ai_suggested_product_id
                          ? productMap.get(d.ai_suggested_product_id) ?? null
                          : null
                      }
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
    </main>
  );
}
