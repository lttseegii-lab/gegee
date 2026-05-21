// Admin-only access helper — use in Server Components / Server Actions.
// Redirects non-admins to home; for API routes use `assertAdmin()` instead.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return { user, profile };
}

/** For API routes: throws an error instead of redirecting */
export async function assertAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHENTICATED');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') throw new Error('FORBIDDEN');
  return { userId: user.id, email: profile.email ?? user.email ?? '' };
}
