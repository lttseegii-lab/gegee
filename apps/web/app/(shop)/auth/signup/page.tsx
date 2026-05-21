'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { signUpWithEmail, signInWithOAuth } from '../actions';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await signUpWithEmail(formData);
      if (res?.error) setError(res.error);
      else if (res?.ok && res.message) setMessage(res.message);
    });
  }

  return (
    <main className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-serif italic text-4xl mb-2 text-center">Бүртгүүлэх</h1>
      <p className="text-ink/60 text-sm text-center mb-10">
        Gegeen Memory Garden, rewards, AI concierge ашиглахын тулд
      </p>

      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => signInWithOAuth('google')}
          className="w-full border border-border rounded-full py-3 text-sm font-medium hover:border-ink transition-colors"
        >
          Google-ээр үргэлжлүүлэх
        </button>
        <button
          type="button"
          onClick={() => signInWithOAuth('facebook')}
          className="w-full border border-border rounded-full py-3 text-sm font-medium hover:border-ink transition-colors"
        >
          Facebook-ээр үргэлжлүүлэх
        </button>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-ink/40">эсвэл имэйлээр</span>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Нэр
          </label>
          <input
            name="name"
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink"
            placeholder="Бат-Эрдэнэ"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Имэйл
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Нууц үг (6+ тэмдэгт)
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="text-sm text-sageDeep bg-mint/40 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full"
        >
          {isPending ? 'Үүсгэж байна…' : 'Бүртгэл үүсгэх'}
        </button>
      </form>

      <p className="text-sm text-ink/60 text-center mt-8">
        Бүртгэлтэй юу?{' '}
        <Link href="/auth/login" className="text-ink underline">
          Нэвтрэх
        </Link>
      </p>
    </main>
  );
}
