'use client';

import { useState, useTransition } from 'react';
import {
  updateMenuSubcategories,
  resetMenuSubcategories,
} from '@/app/admin/theme/actions';
import {
  type MenuSubcategoriesMap,
  type MenuSubcategory,
  type CategoryKey,
} from '@/lib/theme/palette';

const CATEGORY_LABELS: Record<CategoryKey, { icon: string; label: string }> = {
  flowers: { icon: '🌸', label: 'Цэцэг' },
  plants: { icon: '🪴', label: 'Ургамал' },
  gifts: { icon: '🎁', label: 'Бэлэг' },
  cards: { icon: '💌', label: 'Карт' },
  subs: { icon: '📦', label: 'Захиалгат' },
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'item';
}

function genKey(): string {
  return 'sub-' + Math.random().toString(36).slice(2, 8);
}

export function MenuSubcategoriesPicker({
  initial,
}: {
  initial: MenuSubcategoriesMap;
}) {
  const [data, setData] = useState<MenuSubcategoriesMap>(initial);
  const [activeCat, setActiveCat] = useState<CategoryKey>('flowers');
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const list = data[activeCat] ?? [];

  function updateItem(idx: number, patch: Partial<MenuSubcategory>) {
    setData((prev) => ({
      ...prev,
      [activeCat]: prev[activeCat].map((s, i) =>
        i === idx ? { ...s, ...patch } : s
      ),
    }));
    setSavedMsg(null);
  }

  function removeItem(idx: number) {
    setData((prev) => ({
      ...prev,
      [activeCat]: prev[activeCat].filter((_, i) => i !== idx),
    }));
    setSavedMsg(null);
  }

  function addItem() {
    const newItem: MenuSubcategory = {
      key: genKey(),
      label: 'Шинэ',
      tag: 'new-' + Date.now().toString(36),
      column: 1,
    };
    setData((prev) => ({
      ...prev,
      [activeCat]: [...prev[activeCat], newItem],
    }));
    setSavedMsg(null);
  }

  function onSave() {
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await updateMenuSubcategories(data);
      if (res.error) setError(res.error);
      else setSavedMsg('Хадгалагдсан — frontend-д шинэчлэгдэнэ');
    });
  }

  function onReset() {
    if (!confirm('Default subcategory жагсаалт руу буцах уу? Засварлсан зүйл алга болно.')) return;
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await resetMenuSubcategories();
      if (res.error) {
        setError(res.error);
        return;
      }
      // Reset local state too
      window.location.reload();
    });
  }

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => {
          const meta = CATEGORY_LABELS[cat];
          const isActive = activeCat === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-ink text-ink font-medium'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              {meta.icon} {meta.label}{' '}
              <span className="text-xs text-ink/40">({(data[cat] ?? []).length})</span>
            </button>
          );
        })}
      </div>

      {/* List of subcategories */}
      <div className="bg-white border border-border rounded-card p-5">
        {list.length === 0 ? (
          <p className="text-sm text-ink/50 py-6 text-center">
            Хоосон байна — доорхоос Шинэ дэд цэс нэмнэ үү
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((sub, idx) => (
              <li
                key={sub.key}
                className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-3 items-center bg-offwhite rounded-lg px-3 py-2.5"
              >
                {/* Label */}
                <input
                  type="text"
                  value={sub.label}
                  onChange={(e) => {
                    const newLabel = e.target.value;
                    updateItem(idx, {
                      label: newLabel,
                      // Auto-update tag from label if user hasn't customized it
                      tag:
                        sub.tag === slugify(sub.label)
                          ? slugify(newLabel)
                          : sub.tag,
                    });
                  }}
                  placeholder="Нэр"
                  className="border border-border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-ink"
                />
                {/* Tag */}
                <input
                  type="text"
                  value={sub.tag}
                  onChange={(e) =>
                    updateItem(idx, { tag: slugify(e.target.value) })
                  }
                  placeholder="tag"
                  className="border border-border rounded px-2 py-1.5 text-sm bg-white font-mono focus:outline-none focus:border-ink"
                />
                {/* Column */}
                <select
                  value={sub.column}
                  onChange={(e) =>
                    updateItem(idx, {
                      column: Number(e.target.value) === 2 ? 2 : 1,
                    })
                  }
                  className="border border-border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-ink"
                >
                  <option value={1}>Зүүн</option>
                  <option value={2}>Баруун</option>
                </select>
                {/* Badge */}
                <select
                  value={sub.badge ?? ''}
                  onChange={(e) =>
                    updateItem(idx, {
                      badge: (e.target.value || null) as
                        | 'new'
                        | 'top'
                        | null,
                    })
                  }
                  className="border border-border rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-ink"
                >
                  <option value="">—</option>
                  <option value="new">шинэ</option>
                  <option value="top">top</option>
                </select>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-ink/40 hover:text-pinkHot text-sm"
                  aria-label="Устгах"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={addItem}
          disabled={isPending}
          className="mt-4 w-full border-2 border-dashed border-border rounded-lg py-2.5 text-sm text-ink/60 hover:border-ink hover:text-ink transition-colors"
        >
          + Дэд цэс нэмэх
        </button>
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

      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <button
          type="button"
          onClick={onSave}
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

      <div className="text-xs text-ink/40 italic">
        💡 <strong>Tag</strong> бол catalog page-н ?filter=... query param. Энэ tag-тай бүтээгдэхүүн л дэд цэс дээр харагдана. Шинэ tag оруулбал бүтээгдэхүүний форм дотроос тэр tag-руу нэмнэ.
      </div>
    </div>
  );
}
