// OAuth callback — Supabase redirects here after Google/Facebook auth
// or after the email-verification link is clicked.
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/url/safeNext';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // safeNext rejects //evil.com style open-redirect targets.
  const next = safeNext(searchParams.get('next'), '/account/profile');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Brand-new user? Route them through /onboarding before delivering them
      // to `next`. Onboarding completion redirects back to `next` itself.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded_at')
          .eq('id', user.id)
          .maybeSingle();
        if (profile && profile.onboarded_at == null) {
          const onboardingUrl = `/onboarding?next=${encodeURIComponent(next)}`;
          return NextResponse.redirect(`${origin}${onboardingUrl}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('OAuth code exchange failed:', error);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
