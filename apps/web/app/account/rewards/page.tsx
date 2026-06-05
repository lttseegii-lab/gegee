import { createClient } from '@/lib/supabase/server';
import { TIERS, getTier, getNextTier } from '@/lib/rewards/tiers';
import { getRewardsConfig } from '@/lib/rewards/getConfig';

export const metadata = { title: 'Gegeen Rewards' };

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: rewards }, { data: history }, rewardsConfig] =
    await Promise.all([
      supabase
        .from('user_rewards')
        .select('total_points, total_spent, tier')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('rewards_ledger')
        .select('id, points, reason, created_at, order_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      getRewardsConfig(),
    ]);

  const totalPoints = rewards?.total_points ?? 0;
  const totalSpent = rewards?.total_spent ?? 0;
  const currentTier = getTier(totalSpent);
  const nextTier = getNextTier(currentTier.key);
  const spentToNextTier = nextTier
    ? Math.max(0, nextTier.minSpent - totalSpent)
    : 0;
  const progressPct = nextTier
    ? Math.round(
        ((totalSpent - currentTier.minSpent) /
          (nextTier.minSpent - currentTier.minSpent)) *
          100
      )
    : 100;

  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Урамшуулал
      </div>
      <h1 className="font-serif text-4xl mb-2">Gegeen Rewards</h1>
      <p className="text-sm text-ink/60 mb-8">
        Захиалгын дүнгийн{' '}
        <strong className="text-ink">
          {rewardsConfig.earnRatePercent}%
        </strong>{' '}
        нь оноо болж нэмэгдэнэ. Tier-ээс хамаарч давуу талууд нэмэгдэнэ.
      </p>

      {/* Current tier hero */}
      <section className="bg-blush rounded-card p-8 mb-8 text-center">
        <div className="text-5xl mb-3">{currentTier.icon}</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-ink/50 mb-1">
          Таны tier
        </div>
        <h2 className="font-serif italic text-3xl mb-3">{currentTier.label}</h2>
        <div className="flex items-center justify-center gap-6 text-sm text-ink/70 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/40">
              Цуглуулсан оноо
            </div>
            <div className="text-2xl font-semibold text-ink mt-1">
              {totalPoints.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-10 bg-ink/10" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ink/40">
              Нийт зарцуулсан
            </div>
            <div className="text-2xl font-semibold text-ink mt-1">
              {totalSpent.toLocaleString()}₮
            </div>
          </div>
        </div>

        {nextTier ? (
          <>
            <div className="text-xs text-ink/60 mb-2">
              Дараагийн tier <strong>{nextTier.label}</strong> хүртэл{' '}
              <strong>{spentToNextTier.toLocaleString()}₮</strong> үлдсэн
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden mx-auto max-w-md">
              <div
                className="h-full bg-pinkHot transition-all"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </>
        ) : (
          <div className="text-xs text-goldDeep font-medium">
            Хамгийн дээд tier нэрэмжит ✨
          </div>
        )}
      </section>

      {/* Current tier perks */}
      <section className="mb-10">
        <h3 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
          Таны давуу талууд
        </h3>
        <ul className="bg-white border border-border rounded-card p-5 space-y-2 text-sm">
          {currentTier.perks.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-pinkHot">✓</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* All tiers ladder */}
      <section className="mb-10">
        <h3 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
          Бүх tier
        </h3>
        <ol className="space-y-2">
          {TIERS.map((t) => {
            const isCurrent = t.key === currentTier.key;
            const unlocked = totalSpent >= t.minSpent;
            return (
              <li
                key={t.key}
                className={`flex items-center gap-4 p-4 border rounded-card ${
                  isCurrent
                    ? 'border-pinkHot bg-blush'
                    : unlocked
                      ? 'border-border bg-white'
                      : 'border-border bg-offwhite opacity-60'
                }`}
              >
                <div className="text-2xl">{t.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-ink/60">
                    {t.minSpent.toLocaleString()}₮
                    {t.maxSpent != null
                      ? ` - ${t.maxSpent.toLocaleString()}₮`
                      : '+'}{' '}
                    зарцуулсан · {t.multiplier}× оноо
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] uppercase tracking-wider bg-pinkHot text-white px-2 py-1 rounded">
                    Одоо
                  </span>
                )}
                {!isCurrent && unlocked && (
                  <span className="text-[10px] text-sageDeep">✓</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Recent activity */}
      <section>
        <h3 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
          Сүүлийн идэвхжилт
        </h3>
        {!history || history.length === 0 ? (
          <div className="bg-white border border-border rounded-card p-8 text-center text-sm text-ink/50">
            Удахгүй...
          </div>
        ) : (
          <ul className="bg-white border border-border rounded-card overflow-hidden divide-y divide-border">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{h.reason}</div>
                  <div className="text-xs text-ink/40 mt-0.5">
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString('mn-MN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </div>
                </div>
                <span
                  className={`font-semibold whitespace-nowrap ${
                    h.points > 0 ? 'text-sageDeep' : 'text-pinkHot'
                  }`}
                >
                  {h.points > 0 ? '+' : ''}
                  {h.points} оноо
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
