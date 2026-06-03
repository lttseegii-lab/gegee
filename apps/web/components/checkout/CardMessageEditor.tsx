'use client';

import { useState } from 'react';

const STORAGE_KEY = 'gegeen_card_message_draft';
const SUGGESTIONS = [
  'Хайртай шүү ❤️',
  'Төрсөн өдрийн мэнд хүргэе! Танай өдөр сэтгэлийн тэнхээгээр дүүрэн өнгөрөг.',
  'Талархал ихтэй байна. Танд маш их баярлалаа.',
  'Ажил амьдралд тань урам зориг хүсье 🌸',
];

export function CardMessageEditor({
  initial,
}: {
  initial?: string | null;
}) {
  const [value, setValue] = useState(initial ?? '');

  function persist(next: string) {
    setValue(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }

  function applySuggestion(s: string) {
    persist(s);
  }

  return (
    <div className="bg-white border border-border rounded-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="card_message" className="font-medium text-sm">
          Card-д бичих мессеж
        </label>
        <span className="text-xs text-ink/40">{value.length}/280</span>
      </div>
      <textarea
        id="card_message"
        name="card_message"
        value={value}
        onChange={(e) => persist(e.target.value)}
        rows={4}
        maxLength={280}
        placeholder="Хүлээн авагчид зориулсан сэтгэлээсээ мессеж бичээрэй..."
        className="w-full bg-offwhite border border-border rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-ink resize-none"
      />

      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-2 flex items-center gap-2">
          <span>✨ AI санал</span>
          <span className="text-ink/30">·</span>
          <span className="text-ink/40 normal-case tracking-normal">
            Доорх загвараас сонгож өөрчилнө үү
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => applySuggestion(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-offwhite border border-border hover:border-ink transition-colors text-left max-w-[280px] truncate"
              title={s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function readCardMessageDraft(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

export function clearCardMessageDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
