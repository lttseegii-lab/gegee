'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { finishOnboarding } from '@/app/onboarding/actions';

export function FinishButton({
  next,
  label = 'Дуусгах',
  className = 'btn-primary',
  variant = 'submit',
}: {
  next: string;
  label?: string;
  className?: string;
  variant?: 'submit' | 'skip';
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await finishOnboarding(next);
      if (res?.ok) {
        const params = new URLSearchParams({ step: 'done', next });
        if (res.awardedPoints && res.awardedPoints > 0) {
          params.set('bonus', String(res.awardedPoints));
        }
        router.push(`/onboarding?${params.toString()}`);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={className}
    >
      {isPending
        ? 'Хадгалж байна…'
        : variant === 'skip'
          ? 'Алгасах'
          : label}
    </button>
  );
}

/**
 * Button shown on the "done" step — just navigates to `next` (the user is
 * already marked as onboarded by the previous step).
 */
export function DoneButton({
  next,
  label,
  className = 'btn-primary',
}: {
  next: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(next)}
      className={className}
    >
      {label}
    </button>
  );
}
