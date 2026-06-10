'use client';

import { useEffect } from 'react';

/**
 * Shared error-boundary UI. Each route segment's error.tsx renders this so a
 * thrown Server Component (e.g. a Supabase outage) shows a branded retry screen
 * instead of Next's default error page.
 */
export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="text-5xl mb-6">🥀</div>
      <h1 className="font-serif italic text-2xl mb-2">Алдаа гарлаа</h1>
      <p className="text-ink/60 text-sm mb-8">
        Уучлаарай, ямар нэг зүйл буруу болсон байна. Дахин оролдоно уу.
      </p>
      <button type="button" onClick={() => reset()} className="btn-primary">
        Дахин оролдох
      </button>
    </main>
  );
}
