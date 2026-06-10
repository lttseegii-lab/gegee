import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Guard for pages that require a *fully registered* user.
 *
 * A user only counts as registered once they finish onboarding
 * (`profiles.onboarded_at` is set). Authenticating with Google/email creates
 * an auth + profile row immediately, but the account isn't usable until
 * onboarding completes — otherwise an abandoned signup could browse the
 * account area or start a checkout with a half-built profile.
 *
 * Redirects:
 *   - not signed in           → /auth/login?next=<next>
 *   - signed in, not onboarded → /onboarding?next=<next>
 *
 * Returns the authenticated user when registration is complete.
 *
 * @param next Relative path to return to once the user has signed in /
 *             finished onboarding.
 */
export async function requireOnboarded(next: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.onboarded_at == null) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return user;
}

/**
 * Lighter guard: requires only that the user is signed in (NOT that onboarding
 * is finished). Used for checkout/payment so a buyer isn't forced through the
 * full onboarding flow before they can purchase — the biggest conversion drag.
 * Onboarding stays available (and still grants the signup bonus on completion).
 */
export async function requireAuth(next: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  return user;
}
