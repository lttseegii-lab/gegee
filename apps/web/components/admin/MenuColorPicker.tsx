'use client';

import { useState, useTransition } from 'react';
import { updateMenuColors, resetMenuColors } from '@/app/admin/theme/actions';
import {
  COLOR_PALETTE,
  colorToHex,
  isHexColor,
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

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function MenuColorPicker({ initial }: { initial: MenuColorMap }) {
  const [colors, setColors] = useState<MenuColorMap>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickColor(cat: CategoryKey, value: string) {
    setColors((prev) => ({ ...prev, [cat]: value }));
    setSavedMsg(null);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setSavedMsg(null);
    Object.entries(colors).forEach(([cat, value]) => formData.set(cat, value));
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
    <form action={onSubmit} className="space-y-6">
      {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => {
        const meta = CATEGORY_LABELS[cat];
        const selected = colors[cat];
        const selectedHex = colorToHex(selected);
        const isPresetSelected =
          !isHexColor(selected) &&
          COLOR_PALETTE.some((c) => c.key === selected);

        return (
          <div
            key={cat}
            className="bg-white border border-border rounded-card p-6"
          >
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <h3 className="font-medium text-lg">{meta.label}</h3>
              </div>

              {/* Live preview chip */}
              <div className="flex items-center gap-2">
                <span
                  className="w-10 h-10 rounded-lg border border-border shadow-card"
                  style={{ backgroundColor: selectedHex }}
                  aria-label="Сонгосон өнгө"
                />
                <span className="text-[11px] uppercase tracking-wider text-ink/50 font-mono">
                  {selectedHex}
                </span>
              </div>
            </div>

            {/* Custom color row — native color picker + hex input */}
            <div className="flex items-center gap-3 mb-4 bg-offwhite rounded-card px-3 py-2.5">
              <label
                htmlFor={`color-${cat}`}
                className="text-xs uppercase tracking-wider text-ink/50"
              >
                Дурын өнгө
              </label>
              <input
                id={`color-${cat}`}
                type="color"
                value={selectedHex}
                onChange={(e) => pickColor(cat, e.target.value)}
                disabled={isPending}
                className="h-9 w-12 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={isHexColor(selected) ? selected : selectedHex}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (HEX_RE.test(v)) pickColor(cat, v.toLowerCase());
                  else {
                    // Allow partial typing — only commit when valid hex.
                    // But if cleared, revert to current saved value.
                    setColors((prev) => ({ ...prev, [cat]: prev[cat] }));
                  }
                }}
                disabled={isPending}
                placeholder="#fbe6ee"
                maxLength={7}
                className="flex-1 sm:flex-none sm:w-32 bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-ink"
              />
              {isPresetSelected && (
                <span className="text-[10px] uppercase tracking-wider text-ink/40">
                  preset:{' '}
                  {COLOR_PALETTE.find((c) => c.key === selected)?.label}
                </span>
              )}
            </div>

            {/* Preset swatches — quick picks */}
            <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-2">
              Эсвэл preset
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
            <div className="mt-2 grid grid-cols-7 gap-2">
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
