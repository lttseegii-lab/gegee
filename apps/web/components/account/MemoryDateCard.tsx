'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { deleteMemoryDate, toggleReminders } from '@/app/(shop)/account/memory-garden/actions';
import { OCCASIONS, formatMonthDay, type OccasionKey } from '@/lib/memory/occasions';
import { productImageUrl } from '@/lib/ai/pollinations';
import { MemoryDateForm } from './MemoryDateForm';
import type { MemoryDate, Product } from '@/types/database';

export function MemoryDateCard({
  item,
  daysUntil,
  suggestion,
}: {
  item: MemoryDate;
  daysUntil: number | null;
  suggestion: Pick<Product, 'id' | 'name' | 'price' | 'img_seed' | 'img_prompt' | 'img_url'> | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [remindersOn, setRemindersOn] = useState(item.reminders_enabled);

  const occMeta = OCCASIONS[item.occasion as OccasionKey] ?? OCCASIONS.other;

  function onDelete() {
    if (!confirm(`"${item.name}"-ийн ${occMeta.label}-ийг устгах уу?`)) return;
    startTransition(async () => {
      await deleteMemoryDate(item.id);
    });
  }

  function onToggle() {
    const next = !remindersOn;
    setRemindersOn(next);
    startTransition(async () => {
      const res = await toggleReminders(item.id, next);
      if (res.error) setRemindersOn(!next);
    });
  }

  if (editing) {
    return (
      <MemoryDateForm
        initial={item}
        onSaved={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white border border-border rounded-card p-5 flex gap-5">
      <div className="text-4xl flex-shrink-0">{occMeta.icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-lg">{item.name}</h3>
            <div className="text-sm text-ink/60">
              {occMeta.label} · {formatMonthDay(item.month, item.day)}
              {item.year && ` · ${item.year} он`}
            </div>
          </div>
          {daysUntil != null && remindersOn && (
            <span
              className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded whitespace-nowrap ${
                daysUntil <= 7
                  ? 'bg-pinkHot text-white'
                  : daysUntil <= 30
                    ? 'bg-yellow text-ink'
                    : 'bg-mint text-sageDeep'
              }`}
            >
              {daysUntil === 0
                ? 'Өнөөдөр!'
                : daysUntil === 1
                  ? 'Маргааш'
                  : `${daysUntil} хоног`}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-sm text-ink/50 italic mt-2 line-clamp-2">
            “{item.notes}”
          </p>
        )}

        {suggestion && remindersOn && (
          <div className="mt-3 flex items-center gap-3 bg-offwhite rounded-lg p-2.5">
            <div className="relative w-12 h-12 rounded bg-lilac/40 overflow-hidden flex-shrink-0">
              <Image
                src={productImageUrl(suggestion, 100, 100)}
                alt={suggestion.name}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-ink/40">
                AI санал
              </div>
              <Link
                href={`/product/${suggestion.id}`}
                className="text-sm font-medium hover:text-pinkHot truncate block"
              >
                {suggestion.name}
              </Link>
              <div className="text-xs text-ink/60">
                {suggestion.price.toLocaleString()}₮
              </div>
            </div>
            <Link
              href={`/product/${suggestion.id}`}
              className="text-xs text-pinkHot hover:underline whitespace-nowrap"
            >
              Үзэх →
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="text-ink/60 hover:text-ink"
          >
            Засах
          </button>
          <button
            type="button"
            onClick={onToggle}
            disabled={isPending}
            className="text-ink/60 hover:text-ink"
          >
            {remindersOn ? '🔔 Идэвхтэй' : '🔕 Унтрсан'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="ml-auto text-ink/40 hover:text-pinkHot"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
