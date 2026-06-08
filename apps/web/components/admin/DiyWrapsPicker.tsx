'use client';

import { useState, useTransition } from 'react';
import {
  DIY_WRAPS,
  DIY_WRAP_GRADIENTS,
  type DiyWrap,
} from '@/lib/diy/wraps';
import { updateDiyWraps, resetDiyWraps } from '@/app/admin/diy/actions';

function blankWrap(): DiyWrap {
  return {
    key: '',
    name: '',
    description: '',
    price: 5000,
    promptFragment: '',
    emoji: '🎀',
    bgClass: DIY_WRAP_GRADIENTS[0].bgClass,
  };
}

export function DiyWrapsPicker({ initial }: { initial: DiyWrap[] }) {
  const [wraps, setWraps] = useState<DiyWrap[]>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (idx: number, patch: Partial<DiyWrap>) =>
    setWraps((ws) => ws.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  const remove = (idx: number) =>
    setWraps((ws) => ws.filter((_, i) => i !== idx));
  const add = () => setWraps((ws) => [...ws, blankWrap()]);

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const res = await updateDiyWraps(wraps);
      if (res.error) setErr(res.error);
      else {
        setMsg('Хадгаллаа ✓');
        if (res.wraps) setWraps(res.wraps);
      }
    });
  }
  function reset() {
    if (!confirm('Анхдагч боолтууд руу буцаах уу?')) return;
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const res = await resetDiyWraps();
      if (res.error) setErr(res.error);
      else {
        setWraps(DIY_WRAPS);
        setMsg('Анхдагч руу буцаалаа');
      }
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {wraps.map((w, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-end gap-3 bg-white border border-border rounded-card p-3"
          >
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0 ${w.bgClass}`}
            >
              {w.emoji}
            </div>
            <Field label="Нэр" className="w-32">
              <input
                value={w.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                disabled={isPending}
                className="diy-inp"
              />
            </Field>
            <Field label="Key" className="w-24">
              <input
                value={w.key}
                onChange={(e) => update(idx, { key: e.target.value })}
                disabled={isPending}
                placeholder="kraft"
                className="diy-inp"
              />
            </Field>
            <Field label="Emoji" className="w-16">
              <input
                value={w.emoji}
                onChange={(e) => update(idx, { emoji: e.target.value })}
                disabled={isPending}
                className="diy-inp text-center"
              />
            </Field>
            <Field label="Үнэ ₮" className="w-24">
              <input
                type="number"
                value={w.price}
                onChange={(e) =>
                  update(idx, { price: parseInt(e.target.value, 10) || 0 })
                }
                disabled={isPending}
                className="diy-inp"
              />
            </Field>
            <Field label="Дэвсгэр" className="w-28">
              <select
                value={w.bgClass}
                onChange={(e) => update(idx, { bgClass: e.target.value })}
                disabled={isPending}
                className="diy-inp"
              >
                {DIY_WRAP_GRADIENTS.map((g) => (
                  <option key={g.bgClass} value={g.bgClass}>
                    {g.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Тайлбар" className="flex-1 min-w-[140px]">
              <input
                value={w.description}
                onChange={(e) => update(idx, { description: e.target.value })}
                disabled={isPending}
                className="diy-inp"
              />
            </Field>
            <Field label="AI prompt (англиар)" className="flex-1 min-w-[160px]">
              <input
                value={w.promptFragment}
                onChange={(e) =>
                  update(idx, { promptFragment: e.target.value })
                }
                disabled={isPending}
                placeholder="wrapped in kraft paper"
                className="diy-inp"
              />
            </Field>
            <button
              type="button"
              onClick={() => remove(idx)}
              disabled={isPending}
              className="text-ink/40 hover:text-pinkHot text-sm pb-2"
              title="Устгах"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={isPending}
        className="mt-3 text-sm text-pinkHot hover:underline"
      >
        + Боолт нэмэх
      </button>

      <div className="flex items-center gap-3 mt-5">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? 'Хадгалж байна…' : 'Хадгалах'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="btn-ghost"
        >
          Анхдагч
        </button>
        {msg && <span className="text-sm text-sageDeep">{msg}</span>}
        {err && <span className="text-sm text-pinkHot">{err}</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] uppercase tracking-wider text-ink/40 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
