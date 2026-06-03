'use client';

import { useState, useTransition } from 'react';
import {
  updateMenuImages,
  resetMenuImages,
} from '@/app/admin/theme/actions';
import {
  IMAGE_GRADIENTS,
  resolveGradient,
  DEFAULT_MENU_IMAGES,
  type MenuImagesMap,
  type CategoryKey,
  type MegaImageConfig,
} from '@/lib/theme/palette';

const CATEGORY_LABELS: Record<CategoryKey, { icon: string; label: string }> = {
  flowers: { icon: '🌸', label: 'Цэцэг' },
  plants: { icon: '🪴', label: 'Ургамал' },
  gifts: { icon: '🎁', label: 'Бэлэг' },
  cards: { icon: '💌', label: 'Карт' },
  subs: { icon: '📦', label: 'Захиалгат' },
};

const EMPTY_CARD: MegaImageConfig = {
  emoji: '🌸',
  label: '',
  href: '/catalog/all',
  gradient: 'pink-blush',
};

export function MenuImagesPicker({ initial }: { initial: MenuImagesMap }) {
  const [images, setImages] = useState<MenuImagesMap>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setCount(cat: CategoryKey, n: 0 | 1 | 2) {
    setSavedMsg(null);
    setImages((prev) => {
      const current = prev[cat] ?? [];
      const next: MegaImageConfig[] = [];
      for (let i = 0; i < n; i++) {
        next.push(current[i] ?? { ...EMPTY_CARD });
      }
      return { ...prev, [cat]: next };
    });
  }

  function updateCard(
    cat: CategoryKey,
    idx: number,
    field: keyof MegaImageConfig,
    value: string
  ) {
    setSavedMsg(null);
    setImages((prev) => {
      const current = [...(prev[cat] ?? [])];
      current[idx] = { ...current[idx], [field]: value };
      return { ...prev, [cat]: current };
    });
  }

  function onSubmit() {
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await updateMenuImages(images);
      if (res.error) setError(res.error);
      else setSavedMsg('Хадгалагдсан — frontend-д шинэчлэгдэнэ');
    });
  }

  function onReset() {
    if (!confirm('Default зурганд буцаах уу?')) return;
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await resetMenuImages();
      if (res.error) setError(res.error);
      else {
        setImages(DEFAULT_MENU_IMAGES);
        setSavedMsg('Default-руу буцаасан');
      }
    });
  }

  return (
    <div className="space-y-6">
      {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => {
        const meta = CATEGORY_LABELS[cat];
        const cards = images[cat] ?? [];
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
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink/50">Зургийн тоо:</span>
                {[0, 1, 2].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={isPending}
                    onClick={() => setCount(cat, n as 0 | 1 | 2)}
                    className={`w-8 h-8 rounded-full border ${
                      cards.length === n
                        ? 'bg-ink text-white border-ink'
                        : 'bg-white text-ink/60 border-border hover:border-ink'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-sm text-ink/40 text-center py-6 bg-offwhite rounded-card">
                Энэ цэс зурагаар санал болгохгүй
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {cards.map((card, idx) => (
                  <CardEditor
                    key={idx}
                    card={card}
                    disabled={isPending}
                    onChange={(field, value) =>
                      updateCard(cat, idx, field, value)
                    }
                  />
                ))}
              </div>
            )}
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
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
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
      </div>
    </div>
  );
}

function CardEditor({
  card,
  disabled,
  onChange,
}: {
  card: MegaImageConfig;
  disabled: boolean;
  onChange: (field: keyof MegaImageConfig, value: string) => void;
}) {
  const gradient = resolveGradient(card.gradient);

  return (
    <div className="bg-offwhite rounded-card p-4 space-y-3">
      {/* Preview */}
      <div
        className={`aspect-[4/3] ${gradient.bgClass} rounded-lg flex items-center justify-center text-5xl`}
      >
        {card.emoji || '·'}
      </div>

      <div className="grid grid-cols-[60px_1fr] gap-2">
        <input
          type="text"
          value={card.emoji}
          onChange={(e) => onChange('emoji', e.target.value)}
          disabled={disabled}
          maxLength={4}
          placeholder="🌸"
          className="bg-white border border-border rounded-lg px-2 py-2 text-2xl text-center focus:outline-none focus:border-ink"
        />
        <input
          type="text"
          value={card.label}
          onChange={(e) => onChange('label', e.target.value)}
          disabled={disabled}
          maxLength={40}
          placeholder="Card гарчиг"
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      <input
        type="text"
        value={card.href}
        onChange={(e) => onChange('href', e.target.value)}
        disabled={disabled}
        placeholder="/catalog/flowers"
        className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-ink"
      />

      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink/50 mb-1.5">
          Background
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {IMAGE_GRADIENTS.map((g) => (
            <button
              key={g.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange('gradient', g.key)}
              title={g.label}
              className={`h-8 rounded-md border-2 transition-all ${g.bgClass} ${
                card.gradient === g.key
                  ? 'border-ink ring-1 ring-ink/30'
                  : 'border-border hover:border-ink/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
