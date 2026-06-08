'use client';

import { type DiyWrap } from '@/lib/diy/wraps';

interface Props {
  wraps: DiyWrap[];
  selected: string | null;
  onChange: (key: string) => void;
}

export function StepWrap({ wraps, selected, onChange }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif italic text-2xl mb-2">2. Боолтоо сонго</h2>
        <p className="text-sm text-ink/60">
          Цэцгээ ямар хэлбэрээр илгээх вэ?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wraps.map((w) => {
          const active = selected === w.key;
          return (
            <button
              key={w.key}
              type="button"
              onClick={() => onChange(w.key)}
              className={`bg-white rounded-card border-2 p-5 text-left transition-all ${
                active
                  ? 'border-ink shadow-card scale-[1.02]'
                  : 'border-border hover:border-ink/40 hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`aspect-square rounded-lg mb-4 flex items-center justify-center text-5xl ${w.bgClass}`}
              >
                {w.emoji}
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{w.name}</h3>
                {active && (
                  <span className="text-xs text-pinkHot font-medium">✓</span>
                )}
              </div>
              <p className="text-xs text-ink/60 mb-3">{w.description}</p>
              <div className="text-sm font-semibold">
                +{w.price.toLocaleString()}₮
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
