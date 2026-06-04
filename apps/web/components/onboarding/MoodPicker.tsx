'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ONBOARDING_FLOWERS } from '@/lib/onboarding-flowers';
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
  const [failed, setFailed] = useState<Record<string, boolean>>({});

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {ONBOARDING_FLOWERS.map((f) => {
          const active = selected === f.key;
          const imageFailed = failed[f.key];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelected(f.key)}
              disabled={isPending}
              className={`group relative bg-white border rounded-card overflow-hidden text-left transition-all hover:-translate-y-0.5 ${
                active
                  ? 'border-ink ring-2 ring-ink ring-offset-2 ring-offset-offwhite'
                  : 'border-border'
              }`}
            >
              <div
                className={`relative aspect-square ${f.tintClass} overflow-hidden flex items-center justify-center`}
              >
                {imageFailed ? (
                  <span className="text-6xl">{f.emoji}</span>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image_url}
                      alt={f.label}
                      loading="lazy"
                      onError={() =>
                        setFailed((prev) => ({ ...prev, [f.key]: true }))
                      }
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </>
                )}
                {active && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center shadow">
                    ✓
                  </span>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium text-sm text-ink">{f.label}</div>
                <p className="text-xs text-ink/60 mt-0.5 leading-snug line-clamp-2">
                  {f.description}
                </p>
              </div>
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
