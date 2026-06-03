import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TIERS, getTier, getNextTier } from '@/lib/rewards/tiers';
import { PointsAdjuster } from '@/components/admin/PointsAdjuster';

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}) {
  return { title: `Rewards · ${params.userId.slice(0, 8)}` };
}

export default async function AdminRewardsDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();
  const [
    { data: profile },
    { data: rewards },
    { data: ledger },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, name, phone, provider, joined_at')
      .eq('id', params.userId)
      .maybeSingle(),
    supabase
      .from('user_rewards')
      .select('total_points, total_spent, tier, updated_at')
      .eq('user_id', params.userId)
      .maybeSingle(),
    supabase
      .from('rewards_ledger')
      .select('id, points, reason, order_id, created_at')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (!profile) notFound();

  const totalPoints = rewards?.total_points ?? 0;
  const totalSpent = rewards?.total_spent ?? 0;
  const currentTier = getTier(totalSpent);
  const nextTier = getNextTier(currentTier.key);
  const progressPct = nextTier
    ? Math.round(
        ((totalSpent - currentTier.minSpent) /
          (nextTier.minSpent - currentTier.minSpent)) *
          100
      )
    : 100;
  const spentToNext = nextTier
    ? Math.max(0, nextTier.minSpent - totalSpent)
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span className="text-ink/30">›</span>
        <Link href="/admin/rewards" className="hover:text-ink">
          Rewards
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">{profile.name ?? profile.email}</span>
      </nav>

      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-serif italic text-4xl">{profile.name}</h1>
          <div className="text-sm text-ink/60 mt-2">
            {profile.email}
            {profile.phone && ` · ${profile.phone}`}
          </div>
          <div className="text-xs text-ink/40 mt-1">
            {profile.provider} · Бүртгүүлсэн:{' '}
            {profile.joined_at
              ? new Date(profile.joined_at).toLocaleDateString('mn-MN')
              : '—'}
          </div>
        </div>
        <Link
          href={`/admin/customers/${params.userId}`}
          className="text-sm text-ink/60 hover:text-pinkHot whitespace-nowrap"
        >
          Customer profile →
        </Link>
      </header>

      {/* Tier card */}
      <section className="bg-blush rounded-card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">
              Одоогийн tier
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl">{currentTier.icon}</span>
              <span className="font-serif italic text-3xl">
                {currentTier.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink/40">
                Оноо
              </div>
              <div className="text-2xl font-semibold mt-1">
                {totalPoints.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink/40">
                Зарцуулсан
              </div>
              <div className="text-2xl font-semibold mt-1">
                {totalSpent.toLocaleString()}₮
              </div>
            </div>
          </div>
        </div>

        {nextTier ? (
          <div className="mt-5">
            <div className="text-xs text-ink/60 mb-1.5">
              <strong>{nextTier.label}</strong> tier хүртэл{' '}
              <strong>{spentToNext.toLocaleString()}₮</strong> үлдсэн
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-pinkHot transition-all"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-goldDeep font-medium">
            Хамгийн дээд tier ✨
          </div>
        )}
      </section>

      {/* Manual adjuster */}
      <section className="mb-10">
        <header className="mb-4">
          <h2 className="font-serif italic text-2xl">Гар тохируулга</h2>
          <p className="text-sm text-ink/60 mt-1 max-w-prose">
            Эерэг (+) утга оноо нэмнэ, сөрөг (−) утга хасна. Шалтгаан заавал.
            rewards_ledger дотор audit log үүснэ.
          </p>
        </header>
        <div className="bg-white border border-border rounded-card p-5">
          <PointsAdjuster userId={params.userId} />
        </div>
      </section>

      {/* Ledger history */}
      <section>
        <header className="mb-4">
          <h2 className="font-serif italic text-2xl">Гүйлгээний түүх</h2>
          <p className="text-sm text-ink/60 mt-1">
            Хамгийн сүүлийн 100 оноог буцаах гүйлгээ
          </p>
        </header>

        {!ledger || ledger.length === 0 ? (
          <div className="bg-white border border-border rounded-card p-12 text-center text-sm text-ink/50">
            Удахгүй гүйлгээ байхгүй
          </div>
        ) : (
          <ul className="bg-white border border-border rounded-card overflow-hidden divide-y divide-border">
            {ledger.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{entry.reason}</div>
                  <div className="text-xs text-ink/40 mt-0.5">
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleString('mn-MN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                    {entry.order_id && (
                      <>
                        {' · '}
                        <Link
                          href={`/admin/orders/${entry.order_id}`}
                          className="text-ink/60 hover:text-pinkHot underline-offset-2 hover:underline"
                        >
                          Order #{entry.order_id}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`font-semibold whitespace-nowrap text-sm ${
                    entry.points > 0 ? 'text-sageDeep' : 'text-pinkHot'
                  }`}
                >
                  {entry.points > 0 ? '+' : ''}
                  {entry.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
