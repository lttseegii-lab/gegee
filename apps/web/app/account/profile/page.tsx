import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AddressList } from '@/components/account/AddressList';
import { ProfileInfoCard } from '@/components/account/ProfileInfoCard';

export const metadata = { title: 'Профайл' };

const PROVIDER_LABEL: Record<string, string> = {
  email: 'Имэйл',
  google: 'Google',
  facebook: 'Facebook',
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/account/profile');

  const [
    { data: profile },
    { data: rewards },
    { count: orderCount },
    { data: orderTotals },
    { count: deliveredCount },
    { data: addresses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('user_rewards')
      .select('total_points, total_spent, tier')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('orders')
      .select('total')
      .eq('user_id', user.id)
      .eq('status', 'paid'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'delivered'),
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  const totalSpent =
    rewards?.total_spent ??
    (orderTotals ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalPoints = rewards?.total_points ?? 0;

  const name = profile?.name ?? user.email ?? 'Хэрэглэгч';
  const email = user.email ?? '';
  const phone = profile?.phone ?? null;
  const provider = profile?.provider ?? 'email';
  const joinedAt = profile?.joined_at
    ? new Date(profile.joined_at)
    : user.created_at
      ? new Date(user.created_at)
      : null;

  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Хэрэглэгчийн мэдээлэл
      </div>
      <h1 className="font-serif text-4xl mb-2">Профайл</h1>
      <p className="text-sm text-ink/60 mb-8">
        Хувийн мэдээлэл, статистик, бүртгэлийн тохиргоо
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard value={String(orderCount ?? 0)} label="Захиалга" />
        <StatCard value={`${totalSpent.toLocaleString()}₮`} label="Нийт зарцуулсан" />
        <StatCard value={String(deliveredCount ?? 0)} label="Хүлээн авсан баглаа" />
        <StatCard
          value={totalPoints.toLocaleString()}
          label="Урамшууллын оноо"
          accent
        />
      </div>

      {/* Personal info */}
      <ProfileInfoCard
        name={name}
        email={email}
        phone={phone}
        providerLabel={PROVIDER_LABEL[provider] ?? provider}
        joinedAt={
          joinedAt
            ? joinedAt.toLocaleDateString('mn-MN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : null
        }
      />

      {/* Addresses */}
      <AddressList addresses={addresses ?? []} />
    </div>
  );
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-card p-5 text-center ${
        accent ? 'bg-blush' : 'bg-offwhite'
      }`}
    >
      <div className="font-serif text-3xl text-ink mb-1">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink/60">
        {label}
      </div>
    </div>
  );
}

