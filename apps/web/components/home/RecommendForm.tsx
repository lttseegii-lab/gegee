'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Mood } from '@/lib/moods';

const BUDGET_PRESETS = [
  { value: '50000', label: '50K' },
  { value: '100000', label: '100K' },
  { value: '150000', label: '150K' },
  { value: '200000', label: '200K' },
  { value: '300000', label: '300K' },
  { value: '500000', label: '500K+' },
];

const QUICK_EXAMPLES = [
  'Ээждээ, 150K дотор, дулаан өнгөтэй elegant баглаа',
  'Хайрт хүнтэйгээ ой тэмдэглэх, premium, ягаан пион',
  'Найз эмэгтэйд төрсөн өдрийн баяр хүргэх, цайвар өнгөтэй',
  'Уучлал гуйх жижигхэн letterbox',
  'Pet-safe ургамал шинэ гэрт',
];

export function RecommendForm({
  initialQuery,
  initialMood,
  initialBudget,
  moods,
}: {
  initialQuery: string;
  initialMood: string | null;
  initialBudget: string;
  moods: Mood[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [mood, setMood] = useState<string | null>(initialMood);
  const [budget, setBudget] = useState(initialBudget);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (mood) params.set('mood', mood);
    if (budget) params.set('budget', budget);
    router.push(`/recommend?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="bg-white border border-border rounded-card p-6 space-y-5">
      {/* Query */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Юу хэлэх вэ?
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Жишээ нь: Ээждээ, 150K дотор, дулаан өнгөтэй..."
          className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:border-ink"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-offwhite text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              {ex.slice(0, 40)}{ex.length > 40 ? '…' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Mood picker (chips) */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Сэтгэл хөдлөл
        </label>
        <div className="flex flex-wrap gap-1.5">
          {moods.map((m) => {
            const isActive = mood === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(isActive ? null : m.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isActive
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-border hover:border-ink'
                }`}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Төсөв (заавал биш)
        </label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {BUDGET_PRESETS.map((b) => {
            const isActive = budget === b.value;
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => setBudget(isActive ? '' : b.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isActive
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-border hover:border-ink'
                }`}
              >
                {b.label}
              </button>
            );
          })}
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="бусад..."
            className="border border-border rounded-full px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full">
        AI санал авах →
      </button>
    </form>
  );
}
