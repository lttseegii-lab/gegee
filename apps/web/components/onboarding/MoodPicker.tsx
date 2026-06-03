'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MOODS } from '@/lib/moods';
import { saveSignatureMood } from '@/app/onboarding/actions';

export function MoodPicker({
  initial,
  next,
}: {
  initial: string | null;
  next: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onContinue() {
    setError(null);
    startTransition(async () => {
      if (selected) {
        const res = await saveSignatureMood(selected);
        if (res?.error) {
          setError(res.error);
          return;
        }
      }
      router.push(`/onboarding?step=memory&next=${encodeURIComponent(next)}`);
    });
  }

  function onSkip() {
    router.push(`/onboarding?step=memory&next=${encodeURIComponent(next)}`);
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {MOODS.map((m) => {
          const active = selected === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelected(m.key)}
              disabled={isPending}
              className={`relative ${m.bgClass} rounded-card p-4 text-left transition-all hover:-translate-y-0.5 ${
                active
                  ? 'ring-2 ring-ink ring-offset-2 ring-offset-offwhite'
                  : 'ring-1 ring-transparent'
              }`}
            >
              <div className="text-3xl mb-2">{m.emoji}</div>
              <div className="font-medium text-sm text-ink">{m.label}</div>
              <p className="text-xs text-ink/60 mt-1 leading-snug line-clamp-2">
                {m.description}
              </p>
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          disabled={isPending}
          className="text-sm text-ink/60 hover:text-ink"
        >
          Алгасах
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending
            ? 'Хадгалж байна…'
            : selected
              ? 'Хадгалаад үргэлжлүүлэх →'
              : 'Үргэлжлүүлэх →'}
        </button>
      </div>
    </div>
  );
}
