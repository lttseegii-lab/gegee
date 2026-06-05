import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileShell } from '@/components/account/ProfileShell';
import { getOnboardingFlowerByKey } from '@/lib/getOnboardingFlowers';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/account/profile');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, signature_mood')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.name ?? user.email ?? 'Хэрэглэгч';
  const email = user.email ?? '';
  const flower = await getOnboardingFlowerByKey(profile?.signature_mood);

  return (
    <ProfileShell
      name={name}
      email={email}
      flowerImageUrl={flower?.image_url ?? null}
      flowerLabel={flower?.label ?? null}
    >
      {children}
    </ProfileShell>
  );
}
