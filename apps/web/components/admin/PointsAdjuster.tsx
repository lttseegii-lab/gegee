'use client';

import { useState, useTransition } from 'react';
import { adjustUserPoints } from '@/app/admin/rewards/actions';

const PRESET_REASONS = [
  'Welcome bonus',
  'Сэтгэл ханамжийн нөхөлт',
  'Алдааны нөхөн төлбөр',
  'Бэлгийн оноо',
  'Гомдол хэрэгжсэн',
  'Promo campaign',
];

export function PointsAdjuster({ userId }: { userId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [pendingPoints, setPendingPoints] = useState<string>('');
  const [pendingReason, setPendingReason] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await adjustUserPoints(userId, formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setPendingPoints('');
        setPendingReason('');
        setSavedMsg('Оноо шинэчлэгдсэн');
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Оноо (±)
          </label>
          <input
            name="points"
            type="number"
            value={pendingPoints}
            onChange={(e) => setPendingPoints(e.target.value)}
            placeholder="+100 эсвэл -50"
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Шалтгаан
          </label>
          <input
            name="reason"
            type="text"
            value={pendingReason}
            onChange={(e) => setPendingReason(e.target.value)}
            placeholder="Welcome bonus, гомдлын нөхөн төлбөр г.м"
            required
            maxLength={200}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setPendingReason(r)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-white text-ink/70 hover:border-ink hover:text-ink transition-colors"
          >
            {r}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="text-sm text-sageDeep bg-mint/40 rounded-lg px-3 py-2">
          ✓ {savedMsg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !pendingPoints || !pendingReason}
          className="btn-primary"
        >
          {isPending ? 'Хадгалж байна…' : 'Оноо тохируулах'}
        </button>
        <p className="text-xs text-ink/40">
          Энэ нь rewards_ledger дотор audit log үүсгэнэ.
        </p>
      </div>
    </form>
  );
}
