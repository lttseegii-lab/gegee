import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(shop)/auth/actions';

export const metadata = { title: 'Хувийн мэдээлэл' };

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/account/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-[13px] text-ink/60 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Нүүр</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Хувийн мэдээлэл</span>
      </nav>

      <h1 className="font-serif italic text-4xl mb-2">
        Сайн уу, <em>{profile?.name ?? user.email}</em>
      </h1>
      <p className="text-ink/60 text-sm mb-10">
        Бүртгэл: {profile?.provider ?? 'email'} ·{' '}
        {profile?.joined_at
          ? new Date(profile.joined_at).toLocaleDateString('mn-MN')
          : '—'}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Link
          href="/account/orders"
          className="border border-border rounded-card p-6 hover:border-ink transition-colors"
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-medium mb-1">Захиалгууд</h3>
          <p className="text-sm text-ink/60">Захиалгын түүх, төлөв</p>
        </Link>
        <Link
          href="/account/addresses"
          className="border border-border rounded-card p-6 hover:border-ink transition-colors"
        >
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-medium mb-1">Хаяг</h3>
          <p className="text-sm text-ink/60">Хүргэлтийн хаягууд</p>
        </Link>
        <Link
          href="/account/memory-garden"
          className="border border-border rounded-card p-6 hover:border-ink transition-colors sm:col-span-2"
        >
          <div className="text-2xl mb-2">✻</div>
          <h3 className="font-medium mb-1">Memory Garden</h3>
          <p className="text-sm text-ink/60">
            Чухал огноо хадгалж, AI цэцэг ойртохоос өмнө санал болгоно
          </p>
        </Link>
      </div>

      <div className="border border-border rounded-card p-6 mb-10">
        <h3 className="font-medium mb-4">Имэйл</h3>
        <div className="text-sm text-ink/70">{user.email}</div>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-pinkHot hover:underline"
        >
          Гарах
        </button>
      </form>
    </main>
  );
}
