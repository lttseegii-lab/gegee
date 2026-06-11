'use client';

import { useState, useTransition } from 'react';
import { createMemoryDate, updateMemoryDate } from '@/app/account/memory-garden/actions';
import { OCCASIONS, OCCASION_KEYS, type OccasionKey } from '@/lib/memory/occasions';
import type { MemoryDate } from '@/types/database';

const MONTH_NAMES = [
  '1-р сар',
  '2-р сар',
  '3-р сар',
  '4-р сар',
  '5-р сар',
  '6-р сар',
  '7-р сар',
  '8-р сар',
  '9-р сар',
  '10-р сар',
  '11-р сар',
  '12-р сар',
];

export function MemoryDateForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: MemoryDate;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [occasion, setOccasion] = useState<OccasionKey>(
    (initial?.occasion as OccasionKey) ?? 'birthday'
  );

  function handle(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateMemoryDate(initial!.id, formData)
        : await createMemoryDate(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        onSaved?.();
      }
    });
  }

  return (
    <form
      action={handle}
      className="bg-white border border-border rounded-card p-5 space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Нэр <span className="text-pinkHot">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initial?.name ?? ''}
            placeholder="Ээж · Эгч Сараа · Хайрт"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Үйл явдал <span className="text-pinkHot">*</span>
          </label>
          <select
            name="occasion"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value as OccasionKey)}
            required
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          >
            {OCCASION_KEYS.map((k) => (
              <option key={k} value={k}>
                {OCCASIONS[k].icon} {OCCASIONS[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Сар <span className="text-pinkHot">*</span>
          </label>
          <select
            name="month"
            required
            defaultValue={initial?.month ?? new Date().getMonth() + 1}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Өдөр <span className="text-pinkHot">*</span>
          </label>
          <input
            name="day"
            type="number"
            min={1}
            max={31}
            required
            defaultValue={initial?.day ?? new Date().getDate()}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Анхны он (заавал биш)
        </label>
        <input
          name="year"
          type="number"
          min={1900}
          max={2100}
          defaultValue={initial?.year ?? ''}
          placeholder="1985 · 2010 · ...                                                                               "
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
        <p className="text-xs text-ink/40 mt-1">
          Ойн он тооцоолоход ашиглана. Жишээ нь: хуримын 20 жилийн ой.
        </p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
          Тэмдэглэл
        </label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ''}
          placeholder="Жишээ нь: пион цэцэг хайрладаг, шинэ улаан өнгө дургүй..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="reminders_enabled"
          defaultChecked={initial?.reminders_enabled ?? true}
          className="rounded"
        />
        Сануулга идэвхтэй (7 хоног + 1 хоног өмнө)
      </label>

      {error && (
        <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending
            ? 'Хадгалж байна…'
            : isEdit
              ? 'Хадгалах'
              : 'Нэмэх'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-ink/60 hover:text-ink"
          >
            Цуцлах
          </button>
        )}
      </div>
    </form>
  );
}
