// Server Component — reads auth state from cookies via Supabase server client
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOnboardingFlowerByKey } from '@/lib/getOnboardingFlowers';

export async function UserMenu() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="text-ink hover:text-pinkHot transition-colors inline-flex items-center justify-center p-2 -m-2"
        aria-label="Нэвтрэх"
        title="Нэвтрэх"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, signature_mood')
    .eq('id', user.id)
    .single();

  const initial = (profile?.name ?? user.email ?? '?')[0]?.toUpperCase();
  const flower = await getOnboardingFlowerByKey(profile?.signature_mood);

  return (
    <Link
      href="/account/profile"
      className="inline-flex items-center justify-center p-2 -m-2 hover:text-pinkHot transition-colors"
      aria-label="Хувийн мэдээлэл"
      title={profile?.name ?? user.email ?? 'Profile'}
    >
      {flower ? (
        <span className="w-7 h-7 rounded-full overflow-hidden border border-border bg-ink/5 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flower.image_url}
            alt={flower.label}
            className="w-full h-full object-cover"
          />
        </span>
      ) : (
        <span className="w-7 h-7 rounded-full bg-lilac flex items-center justify-center text-[12px] font-semibold">
          {initial}
        </span>
      )}
    </Link>
  );
}
