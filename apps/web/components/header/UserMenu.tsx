// Server Component — reads auth state from cookies via Supabase server client
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export async function UserMenu() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-sm text-ink hover:text-pinkHot"
      >
        Нэвтрэх
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url')
    .eq('id', user.id)
    .single();

  const initial = (profile?.name ?? user.email ?? '?')[0]?.toUpperCase();

  return (
    <Link
      href="/account/profile"
      className="flex items-center gap-2 text-sm hover:text-pinkHot transition-colors"
    >
      <span className="w-7 h-7 rounded-full bg-lilac flex items-center justify-center text-[12px] font-semibold">
        {initial}
      </span>
      <span className="hidden sm:inline">
        {profile?.name?.split(' ')[0] ?? 'Profile'}
      </span>
    </Link>
  );
}
