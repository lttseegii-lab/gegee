'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  RECIPIENTS,
  OCCASIONS,
  COLORS,
  type RecommendOption,
} from '@/lib/recommend';

const BUDGET_PRESETS = [
  { value: '50000', label: '50K' },
  { value: '100000', label: '100K' },
  { value: '150000', label: '150K' },
  { value: '200000', label: '200K' },
  { value: '300000', label: '300K' },
  { value: '500000', label: '500K+' },
];

function chipClass(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
    active
      ? 'bg-ink text-white border-ink'
      : 'bg-white text-ink border-border hover:border-ink'
  }`;
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: RecommendOption[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(active ? null : o.key)}
              className={chipClass(active)}
            >
              <span>{o.emoji}</span>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecommendForm({
  initialRecipient,
  initialOccasion,
  initialColor,
  initialBudget,
  initialQuery,
}: {
  initialRecipient: string | null;
  initialOccasion: string | null;
  initialColor: string | null;
  initialBudget: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const [recipient, setRecipient] = useState<string | null>(initialRecipient);
  const [occasion, setOccasion] = useState<string | null>(initialOccasion);
  const [color, setColor] = useState<string | null>(initialColor);
  const [budget, setBudget] = useState(initialBudget);
  const [query, setQuery] = useState(initialQuery);

  const canSubmit = Boolean(recipient || occasion || color || query.trim());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (recipient) params.set('recipient', recipient);
    if (occasion) params.set('occasion', occasion);
    if (color) params.set('color', color);
    if (budget) params.set('budget', budget);
    if (query.trim()) params.set('q', query.trim());
    router.push(`/recommend?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-border rounded-card p-6 space-y-6"
    >
      <ChipGroup
        label="Хэнд бэлэглэх вэ?"
        options={RECIPIENTS}
        value={recipient}
        onChange={setRecipient}
      />
      <ChipGroup
        label="Ямар учир шалтгаанаар?"
        options={OCCASIONS}
        value={occasion}
        onChange={setOccasion}
      />
      <ChipGroup
        label="Өнгө / мэдрэмж"
        options={COLORS}
        value={color}
        onChange={setColor}
      />

      {/* Budget */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
          Төсөв{' '}
          <span className="text-ink/40 normal-case tracking-normal">
            (заавал биш)
          </span>
        </label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {BUDGET_PRESETS.map((b) => {
            const active = budget === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => setBudget(active ? '' : b.value)}
                className={chipClass(active)}
              >
                {b.label}
              </button>
            );
          })}
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="бусад…"
            className="border border-border rounded-full px-3 py-1.5 text-sm w-24 focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {/* Optional free-text note */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
          Нэмэлт хүсэл{' '}
          <span className="text-ink/40 normal-case tracking-normal">
            (заавал биш)
          </span>
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Жишээ нь: пиончтой, жижигхэн letterbox…"
          className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✨ AI санал авах →
      </button>
    </form>
  );
}
