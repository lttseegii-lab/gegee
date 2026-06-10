'use client';

import { useRef, useState, useTransition } from 'react';
import { DIY_FLOWERS, type DiyFlower } from '@/lib/diy/flowers';
import {
  updateDiyFlowers,
  resetDiyFlowers,
  uploadDiyImage,
} from '@/app/admin/diy/actions';

function blankFlower(): DiyFlower {
  return {
    key: '',
    name: '',
    emoji: '🌸',
    price: 5000,
    promptFragment: '',
    color: '#f5c6d0',
  };
}

export function DiyFlowersPicker({ initial }: { initial: DiyFlower[] }) {
  const [flowers, setFlowers] = useState<DiyFlower[]>(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (idx: number, patch: Partial<DiyFlower>) =>
    setFlowers((fs) => fs.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  const remove = (idx: number) =>
    setFlowers((fs) => fs.filter((_, i) => i !== idx));
  const add = () => setFlowers((fs) => [...fs, blankFlower()]);

  function save() {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const res = await updateDiyFlowers(flowers);
      if (res.error) setErr(res.error);
      else {
        setMsg('Хадгаллаа ✓');
        if (res.flowers) setFlowers(res.flowers);
      }
    });
  }
  function reset() {
    if (!confirm('Анхдагч цэцгүүд рүү буцаах уу?')) return;
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const res = await resetDiyFlowers();
      if (res.error) setErr(res.error);
      else {
        setFlowers(DIY_FLOWERS);
        setMsg('Анхдагч руу буцаалаа');
      }
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {flowers.map((f, idx) => (
          <FlowerRow
            key={idx}
            flower={f}
            disabled={isPending}
            onChange={(patch) => update(idx, patch)}
            onRemove={() => remove(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={isPending}
        className="mt-3 text-sm text-pinkHot hover:underline"
      >
        + Цэцэг нэмэх
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

function FlowerRow({
  flower,
  disabled,
  onChange,
  onRemove,
}: {
  flower: DiyFlower;
  disabled: boolean;
  onChange: (patch: Partial<DiyFlower>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUpErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadDiyImage(fd);
      if (res.error) setUpErr(res.error);
      else if (res.url) onChange({ image_url: res.url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 bg-white border border-border rounded-card p-3">
      {/* Image / emoji preview + upload */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        title="Зураг солих"
        className="w-16 h-16 rounded-lg overflow-hidden border border-border flex items-center justify-center text-2xl shrink-0 hover:border-ink"
        style={{ background: flower.color + '30' }}
      >
        {uploading ? (
          '…'
        ) : flower.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flower.image_url}
            alt={flower.name}
            className="w-full h-full object-cover"
          />
        ) : (
          flower.emoji
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      <Field label="Нэр" className="w-32">
        <input
          value={flower.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          className="diy-inp"
        />
      </Field>
      <Field label="Key" className="w-24">
        <input
          value={flower.key}
          onChange={(e) => onChange({ key: e.target.value })}
          disabled={disabled}
          placeholder="rose"
          className="diy-inp"
        />
      </Field>
      <Field label="Emoji" className="w-16">
        <input
          value={flower.emoji}
          onChange={(e) => onChange({ emoji: e.target.value })}
          disabled={disabled}
          className="diy-inp text-center"
        />
      </Field>
      <Field label="Үнэ ₮" className="w-24">
        <input
          type="number"
          value={flower.price}
          onChange={(e) => onChange({ price: parseInt(e.target.value, 10) || 0 })}
          disabled={disabled}
          className="diy-inp"
        />
      </Field>
      <Field label="Өнгө" className="w-14">
        <input
          type="color"
          value={flower.color}
          onChange={(e) => onChange({ color: e.target.value })}
          disabled={disabled}
          className="w-full h-9 rounded border border-border"
        />
      </Field>
      <Field label="AI prompt (англиар)" className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-[160px]">
        <input
          value={flower.promptFragment}
          onChange={(e) => onChange({ promptFragment: e.target.value })}
          disabled={disabled}
          placeholder="pink peonies"
          className="diy-inp"
        />
      </Field>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="text-ink/40 hover:text-pinkHot text-sm pb-2"
        title="Устгах"
      >
        ✕
      </button>
      {upErr && <p className="w-full text-xs text-pinkHot">{upErr}</p>}
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
