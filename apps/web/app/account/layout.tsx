import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileShell } from '@/components/account/ProfileShell';

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
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.name ?? user.email ?? 'Хэрэглэгч';
  const email = user.email ?? '';

  return (
    <ProfileShell name={name} email={email}>
      {children}
    </ProfileShell>
  );
}
