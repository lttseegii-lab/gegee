'use client';

import { useState, useTransition } from 'react';
import {
  updateRewardsConfig,
  resetRewardsConfig,
} from '@/app/admin/rewards/actions';
import {
  DEFAULT_REWARDS_CONFIG,
  type RewardsConfig,
} from '@/lib/rewards/config';

/**
 * Admin editor for site-wide rewards behaviour:
 *  - Signup bonus (one-time award when a new user completes onboarding)
 *  - Earn rate (% of every paid order that becomes loyalty points)
 *
 * Component name kept as SignupBonusEditor for import-stability; really it
 * edits the full RewardsConfig now.
 */
export function SignupBonusEditor({ initial }: { initial: RewardsConfig }) {
  const [signupBonus, setSignupBonus] = useState<number>(initial.signupBonus);
  const [earnRate, setEarnRate] = useState<number>(initial.earnRatePercent);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    signupBonus !== initial.signupBonus ||
    earnRate !== initial.earnRatePercent;

  function onSave() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('signupBonus', String(signupBonus));
      fd.set('earnRatePercent', String(earnRate));
      const res = await updateRewardsConfig(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.signupBonus != null) setSignupBonus(res.signupBonus);
      if (res.earnRatePercent != null) setEarnRate(res.earnRatePercent);
      setSavedAt(Date.now());
    });
  }

  function onReset() {
    if (!confirm('Default утга руу буцаах уу?')) return;
    setError(null);
    startTransition(async () => {
      const res = await resetRewardsConfig();
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.signupBonus != null) setSignupBonus(res.signupBonus);
      if (res.earnRatePercent != null) setEarnRate(res.earnRatePercent);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="bg-gradient-to-br from-blush via-yellow-pale/40 to-mint/30 border border-border rounded-card p-5 mb-6">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🎁</span>
          <h3 className="font-medium text-lg">Rewards тохиргоо</h3>
        </div>
        <p className="text-sm text-ink/60 max-w-prose">
          Шинэ хэрэглэгчид өгөх бэлэг ба захиалга бүрээс хуримтлуулах онооны
          хувийг тохируулна.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {/* Signup bonus */}
        <div className="bg-white/60 rounded-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-sm">Бүртгэлийн бэлэг</label>
            <span className="text-[10px] uppercase tracking-wider text-ink/40">
              default {DEFAULT_REWARDS_CONFIG.signupBonus.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-ink/55 mb-3">
            Хэрэглэгч onboarding-аа дуусгахад автоматаар нэмэгдэх оноо
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100000}
              step={100}
              value={signupBonus}
              onChange={(e) =>
                setSignupBonus(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              disabled={isPending}
              className="w-32 bg-white border border-border rounded-lg px-3 py-2.5 text-lg font-medium text-right focus:outline-none focus:border-ink"
            />
            <span className="text-sm text-ink/50">оноо</span>
          </div>
        </div>

        {/* Earn rate */}
        <div className="bg-white/60 rounded-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-sm">Худалдан авалтын хувь</label>
            <span className="text-[10px] uppercase tracking-wider text-ink/40">
              default {DEFAULT_REWARDS_CONFIG.earnRatePercent}%
            </span>
          </div>
          <p className="text-xs text-ink/55 mb-3">
            Захиалгын дүнгийн хэдэн хувийг оноо болгох вэ
            <br />
            Жн.{' '}
            <strong>
              {earnRate}% × 100,000₮ ={' '}
              {Math.floor((100000 * earnRate) / 100).toLocaleString()} оноо
            </strong>
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={earnRate}
              onChange={(e) =>
                setEarnRate(
                  Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                )
              }
              disabled={isPending}
              className="w-24 bg-white border border-border rounded-lg px-3 py-2.5 text-lg font-medium text-right focus:outline-none focus:border-ink"
            />
            <span className="text-sm text-ink/50">%</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-pinkHot bg-white rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
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
          Default-руу буцаах
        </button>

        {savedAt && !error && (
          <span className="text-sm text-sageDeep">✓ Хадгалагдсан</span>
        )}
      </div>

      <div className="mt-4 text-xs text-ink/50">
        <strong>Бүртгэлийн бэлэг:</strong> зөвхөн дараагийн шинэ бүртгэлд
        хэрэглэгдэнэ.
        <br />
        <strong>Худалдан авалтын хувь:</strong> зөвхөн дараагийн төлөгдсөн
        захиалгад хэрэглэгдэнэ — хуучин захиалгад нөлөөлөхгүй.
      </div>
    </div>
  );
}
