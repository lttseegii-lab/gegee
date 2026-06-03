'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signInWithEmail(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Имэйл ба нууц үгээ оруулна уу' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');

  // If user hasn't completed onboarding, route them through it first.
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profile && profile.onboarded_at == null) {
      redirect('/onboarding?next=/account/profile');
    }
  }

  redirect('/account/profile');
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!email || !password || !name) {
    return { error: 'Бүх талбарыг бөглөнө үү' };
  }
  if (password.length < 6) {
    return { error: 'Нууц үг 6+ тэмдэгттэй байх ёстой' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  return { ok: true, message: 'Имэйл рүү тань баталгаажуулах холбоос явууллаа.' };
}

export async function signInWithOAuth(provider: 'google' | 'facebook') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
