'use client';

import { useState, useTransition } from 'react';
import { upsertCapacity } from '@/app/admin/capacity/actions';

export function CapacityDayCard({
  date,
  initialMax,
  initialUsed,
  initialClosed,
  isToday,
}: {
  date: string;
  initialMax: number;
  initialUsed: number;
  initialClosed: boolean;
  isToday: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [maxOrders, setMaxOrders] = useState(initialMax);
  const [closed, setClosed] = useState(initialClosed);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const d = new Date(date);
  const weekday = d.toLocaleDateString('mn-MN', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('mn-MN', { month: 'short' });
  const pct = maxOrders > 0 ? Math.round((initialUsed / maxOrders) * 100) : 0;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await upsertCapacity(date, {
        max_orders: maxOrders,
        closed,
      });
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  }

  function toggleClosed() {
    const next = !closed;
    setClosed(next);
    startTransition(async () => {
      const res = await upsertCapacity(date, { closed: next });
      if (res.error) {
        setError(res.error);
        setClosed(!next);
      }
    });
  }

  const barColor =
    closed
      ? 'bg-ink/30'
      : pct >= 90
        ? 'bg-pinkHot'
        : pct >= 60
          ? 'bg-goldDeep'
          : 'bg-sageDeep';

  return (
    <div
      className={`bg-white border rounded-card p-4 ${
        isToday ? 'border-ink' : 'border-border'
      } ${closed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink/40">
            {weekday}
          </div>
          <div className="font-serif italic text-2xl mt-0.5">
            {day} <span className="text-base text-ink/60">{month}</span>
          </div>
          {isToday && (
            <div className="text-[10px] uppercase tracking-wider text-pinkHot mt-1">
              Өнөөдөр
            </div>
          )}
        </div>
        {closed && (
          <span className="text-[10px] uppercase tracking-wider bg-ink text-white px-2 py-1 rounded">
            Хаалттай
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink/60 mb-1">
              Дээд хязгаар
            </label>
            <input
              type="number"
              value={maxOrders}
              onChange={(e) => setMaxOrders(parseInt(e.target.value, 10) || 0)}
              className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-ink"
              min={0}
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
            />
            Энэ өдөр хаах
          </label>
          {error && (
            <div className="text-xs text-pinkHot">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="text-xs bg-ink text-white px-3 py-1.5 rounded-full disabled:opacity-50"
            >
              Хадгалах
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setMaxOrders(initialMax);
                setClosed(initialClosed);
              }}
              className="text-xs text-ink/60"
            >
              Цуцлах
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm mb-1.5">
            <span className="font-semibold">{initialUsed}</span>
            <span className="text-ink/40"> / {maxOrders}</span>
          </div>
          <div className="h-1.5 bg-offwhite rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-ink/60 hover:text-ink"
            >
              Засах
            </button>
            <button
              type="button"
              onClick={toggleClosed}
              disabled={isPending}
              className="ml-auto text-ink/60 hover:text-ink disabled:opacity-50"
            >
              {closed ? 'Нээх' : 'Хаах'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
