import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TIERS } from '@/lib/rewards/tiers';
import { getRewardsConfig } from '@/lib/rewards/getConfig';
import { SignupBonusEditor } from '@/components/admin/SignupBonusEditor';

export const metadata = { title: 'Rewards' };

export default async function AdminRewardsPage({
  searchParams,
}: {
  searchParams: { tier?: string; q?: string };
}) {
  const tierFilter = searchParams.tier ?? null;
  const search = (searchParams.q ?? '').trim().toLowerCase();

  const supabase = createClient();

  // Fetch all rewards rows joined with profile info.
  // user_rewards has no FK to profiles, but both reference auth.users via id.
  const [{ data: rewardsRows }, rewardsConfig] = await Promise.all([
    supabase
      .from('user_rewards')
      .select('user_id, total_points, total_spent, tier, updated_at')
      .order('total_spent', { ascending: false })
      .limit(500),
    getRewardsConfig(),
  ]);

  const userIds = (rewardsRows ?? []).map((r) => r.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from('profiles')
        .select('id, email, name, provider, joined_at')
        .in('id', userIds)
    : { data: [] };

  const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let rows = (rewardsRows ?? []).map((r) => ({
    ...r,
    profile: profilesMap.get(r.user_id),
  }));

  // Tier counts (computed before search filter for accurate overview)
  const tierCounts: Record<string, number> = {};
  for (const t of TIERS) tierCounts[t.key] = 0;
  for (const r of rows) {
    if (r.tier && tierCounts[r.tier] != null) tierCounts[r.tier]++;
  }

  // Apply filters
  if (tierFilter) rows = rows.filter((r) => r.tier === tierFilter);
  if (search) {
    rows = rows.filter((r) => {
      const p = r.profile;
      return (
        p?.email?.toLowerCase().includes(search) ||
        p?.name?.toLowerCase().includes(search)
      );
    });
  }

  const totalPoints = rows.reduce((sum, r) => sum + (r.total_points ?? 0), 0);
  const totalSpent = rows.reduce((sum, r) => sum + (r.total_spent ?? 0), 0);

  return (
    <div className="p-8 max-w-6xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Rewards</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Rewards удирдлага</h1>
        <p className="text-sm text-ink/60 mt-2 max-w-prose">
          Loyalty оноо + tier систем. Хэрэглэгч бүрд гар ажиллагаагаар оноо
          нэмж, хасах боломжтой.
        </p>
      </header>

      {/* Signup bonus + earn rate editor */}
      <SignupBonusEditor initial={rewardsConfig} />

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Нийт хэрэглэгч" value={(rewardsRows ?? []).length.toLocaleString()} />
        <StatCard label="Хуримтлагдсан оноо" value={totalPoints.toLocaleString()} />
        <StatCard
          label="Нийт зарцуулсан"
          value={`${totalSpent.toLocaleString()}₮`}
        />
        <StatCard
          label="Дундаж захиалга"
          value={
            rewardsRows && rewardsRows.length > 0
              ? `${Math.round(totalSpent / rewardsRows.length).toLocaleString()}₮`
              : '—'
          }
        />
      </div>

      {/* Tier filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href="/admin/rewards"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
            !tierFilter
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-ink border-border hover:border-ink'
          }`}
        >
          Бүгд <span className="text-[10px] opacity-60">{(rewardsRows ?? []).length}</span>
        </Link>
        {TIERS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/rewards?tier=${t.key}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              tierFilter === t.key
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink border-border hover:border-ink'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            <span className="text-[10px] opacity-60">{tierCounts[t.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-5">
        {tierFilter && <input type="hidden" name="tier" value={tierFilter} />}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Имэйл эсвэл нэрээр хайх..."
          className="w-full md:w-72 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
        />
      </form>

      {/* Table */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-offwhite text-[11px] uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left px-4 py-3">Хэрэглэгч</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-right px-4 py-3">Оноо</th>
              <th className="text-right px-4 py-3">Зарцуулсан</th>
              <th className="text-right px-4 py-3">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-ink/50"
                >
                  Хэрэглэгч олдсонгүй
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const tier = TIERS.find((t) => t.key === r.tier);
                return (
                  <tr key={r.user_id} className="hover:bg-offwhite">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {r.profile?.name ?? '—'}
                      </div>
                      <div className="text-xs text-ink/50">
                        {r.profile?.email ?? r.user_id.slice(0, 12)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {tier?.icon} {r.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(r.total_points ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-ink/70">
                      {(r.total_spent ?? 0).toLocaleString()}₮
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/rewards/${r.user_id}`}
                        className="text-sm text-ink/60 hover:text-pinkHot"
                      >
                        Дэлгэрэнгүй →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-border rounded-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-1">
        {label}
      </div>
      <div className="text-2xl font-serif italic">{value}</div>
    </div>
  );
}
