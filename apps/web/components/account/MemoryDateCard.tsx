'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteMemoryDate, toggleReminders } from '@/app/account/memory-garden/actions';
import { OCCASIONS, formatMonthDay, type OccasionKey } from '@/lib/memory/occasions';
import { MemoryDateForm } from './MemoryDateForm';
import type { MemoryDate } from '@/types/database';

export type MemoryOrder = {
  id: number;
  order_code: string | null;
  total: number;
  status: string | null;
  created_at: string | null;
  memory_date_id: number | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Төлбөр хүлээж байна',
  paid: 'Төлбөр төлөгдсөн',
  preparing: 'Бэлдэж байна',
  shipped: 'Хүргэлтэнд',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаасан',
};

export function MemoryDateCard({
  item,
  daysUntil,
  orders,
}: {
  item: MemoryDate;
  daysUntil: number | null;
  orders: MemoryOrder[];
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

        {/* Хүргэлтийн түүх — тухайн event-д хүргүүлсэн захиалгууд */}
        {orders.length > 0 ? (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider text-ink/40 mb-1.5">
              Хүргэлтийн түүх ({orders.length})
            </div>
            <ul className="space-y-1.5">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 bg-offwhite rounded-lg px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink truncate">
                      {o.order_code}
                    </div>
                    <div className="text-ink/50">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString('mn-MN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}{' '}
                      · {STATUS_LABEL[o.status ?? ''] ?? o.status ?? '—'}
                    </div>
                  </div>
                  <div className="font-semibold text-ink whitespace-nowrap">
                    {o.total.toLocaleString()}₮
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3 bg-offwhite rounded-lg px-3 py-2.5 text-xs">
            <span className="text-ink/50">
              Энэ event-д цэцэг хүргүүлж байгаагүй
            </span>
            <Link
              href={`/catalog/all?for_memory=${item.id}`}
              className="text-pinkHot hover:underline whitespace-nowrap font-medium"
            >
              Цэцэг сонгох →
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
