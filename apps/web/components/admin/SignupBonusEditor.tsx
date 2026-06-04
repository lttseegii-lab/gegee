'use client';

import { useState, useTransition } from 'react';
import {
  updateSignupBonus,
  resetSignupBonus,
} from '@/app/admin/rewards/actions';
import { DEFAULT_REWARDS_CONFIG } from '@/lib/rewards/config';

export function SignupBonusEditor({ initial }: { initial: number }) {
  const [value, setValue] = useState<number>(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = value !== initial;

  function onSave() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('signupBonus', String(value));
      const res = await updateSignupBonus(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.signupBonus != null) setValue(res.signupBonus);
      setSavedAt(Date.now());
    });
  }

  function onReset() {
    if (!confirm('Default утга руу буцаах уу?')) return;
    setError(null);
    startTransition(async () => {
      const res = await resetSignupBonus();
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.signupBonus != null) setValue(res.signupBonus);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="bg-gradient-to-br from-blush via-yellow-pale/40 to-mint/30 border border-border rounded-card p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎁</span>
            <h3 className="font-medium text-lg">Бүртгэлийн бэлэг</h3>
          </div>
          <p className="text-sm text-ink/60 max-w-md">
            Шинэ хэрэглэгч бүртгүүлээд onboarding-ээ дуусгахад автоматаар
            нэмэгдэх оноо. 0 болговол бэлэг өгөхгүй.
          </p>
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ink/40 whitespace-nowrap">
          Default: {DEFAULT_REWARDS_CONFIG.signupBonus.toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <input
            type="number"
            min={0}
            max={100000}
            step={100}
            value={value}
            onChange={(e) =>
              setValue(Math.max(0, parseInt(e.target.value, 10) || 0))
            }
            disabled={isPending}
            className="w-40 bg-white border border-border rounded-lg px-3 py-2.5 text-lg font-medium text-right focus:outline-none focus:border-ink"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 pointer-events-none">
            оноо
          </span>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !isDirty}
          className="btn-primary"
        >
          {isPending ? 'Хадгалж байна…' : 'Хадгалах'}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={isPending}
          className="text-sm text-ink/60 hover:text-pinkHot"
        >
          Default ({DEFAULT_REWARDS_CONFIG.signupBonus.toLocaleString()}) болгох
        </button>

        {savedAt && !error && (
          <span className="text-sm text-sageDeep">
            ✓ Хадгалагдсан
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3 text-sm text-pinkHot bg-white rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border/50 text-xs text-ink/50">
        Энэ утга өөрчлөгдөхөд хэдийн бүртгүүлсэн хэрэглэгчдэд нөлөөлөхгүй —
        зөвхөн дараагийн шинэ бүртгэлд хэрэглэгдэнэ.
      </div>
    </div>
  );
}
