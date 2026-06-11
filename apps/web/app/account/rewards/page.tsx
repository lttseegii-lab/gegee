import { createClient } from '@/lib/supabase/server';
import { getRewardsConfig } from '@/lib/rewards/getConfig';

export const metadata = { title: 'Урамшууллын оноо' };

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

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-4xl mb-2">Урамшууллын оноо</h1>
      <p className="text-sm text-ink/60 mb-8">
        Захиалгын дүнгийн{' '}
        <strong className="text-ink">
          {rewardsConfig.earnRatePercent}%
        </strong>{' '}
        нь оноо болж нэмэгдэнэ.
      </p>

      {/* Points summary */}
      <section className="bg-blush rounded-card p-8 mb-8 text-center">
        <div className="text-5xl mb-4">🌸</div>
        <div className="flex items-center justify-center gap-6 text-sm text-ink/70">
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
      </section>

      {/* Recent activity */}
      <section>
        <h3 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-3">
          Онооны түүх
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
