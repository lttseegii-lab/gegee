'use client';

import { useState, useTransition } from 'react';
import { updateMenuColors, resetMenuColors } from '@/app/admin/theme/actions';
import {
  COLOR_PALETTE,
  type MenuColorMap,
  type CategoryKey,
} from '@/lib/theme/palette';

const CATEGORY_LABELS: Record<CategoryKey, { icon: string; label: string }> = {
  flowers: { icon: '🌸', label: 'Цэцэг' },
  plants: { icon: '🪴', label: 'Ургамал' },
  gifts: { icon: '🎁', label: 'Бэлэг' },
  cards: { icon: '💌', label: 'Карт' },
  subs: { icon: '📦', label: 'Захиалгат' },
};

export function MenuColorPicker({ initial }: { initial: MenuColorMap }) {
  const [colors, setColors] = useState<MenuColorMap>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickColor(cat: CategoryKey, key: string) {
    setColors((prev) => ({ ...prev, [cat]: key }));
    setSavedMsg(null);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setSavedMsg(null);
    // Override formData with our state (since we use buttons not inputs)
    Object.entries(colors).forEach(([cat, key]) => formData.set(cat, key));
    startTransition(async () => {
      const res = await updateMenuColors(formData);
      if (res.error) setError(res.error);
      else setSavedMsg('Хадгалагдсан — frontend-д шинэчлэгдэнэ');
    });
  }

  function onReset() {
    if (!confirm('Default өнгөнд буцаах уу?')) return;
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await resetMenuColors();
      if (res.error) setError(res.error);
      else {
        setColors({
          flowers: 'blush',
          plants: 'mint',
          gifts: 'lilac',
          cards: 'purpleSoft',
          subs: 'peach',
        });
        setSavedMsg('Default-руу буцаасан');
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-8">
      {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => {
        const meta = CATEGORY_LABELS[cat];
        const selected = colors[cat];
        return (
          <div
            key={cat}
            className="bg-white border border-border rounded-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <h3 className="font-medium text-lg">{meta.label}</h3>
              </div>
              {/* Preview pill */}
              <span
                className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    COLOR_PALETTE.find((c) => c.key === selected)?.hex ??
                    '#f5ebee',
                }}
              >
                {selected}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_PALETTE.map((c) => {
                const isActive = c.key === selected;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => pickColor(cat, c.key)}
                    disabled={isPending}
                    title={c.label}
                    className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                      isActive
                        ? 'border-ink ring-2 ring-ink/20'
                        : 'border-border'
                    } disabled:opacity-50`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-ink text-sm font-semibold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {COLOR_PALETTE.map((c) => (
                <div
                  key={c.key}
                  className="text-[10px] text-ink/60 text-center truncate"
                >
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}

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

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button type="submit" disabled={isPending} className="btn-primary">
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
      </div>
    </form>
  );
}
