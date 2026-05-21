'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/admin/products/actions';
import { aiImageUrl } from '@/lib/ai/pollinations';
import type { Product } from '@/types/database';

const BADGE_OPTIONS = [
  { value: '', label: '— Байхгүй —' },
  { value: 'top-pick', label: 'Top Pick' },
  { value: 'new-pill', label: 'Шинэ' },
  { value: 'letterbox-pill', label: 'Letterbox' },
  { value: 'double-points', label: 'Double Points' },
];

export function ProductForm({
  initial,
  mode,
}: {
  initial?: Partial<Product>;
  mode: 'create' | 'edit';
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imgPrompt, setImgPrompt] = useState(initial?.img_prompt ?? '');
  const [imgSeed, setImgSeed] = useState<number>(initial?.img_seed ?? 1000);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res =
        mode === 'create'
          ? await createProduct(formData)
          : await updateProduct(initial!.id!, formData);
      if (res?.error) setError(res.error);
    });
  }

  function onDelete() {
    if (!confirm(`"${initial?.name}" бүтээгдэхүүнийг устгах уу?`)) return;
    startTransition(async () => {
      await deleteProduct(initial!.id!);
    });
  }

  const previewUrl = imgPrompt
    ? aiImageUrl(imgPrompt, imgSeed, 400, 400)
    : null;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <form action={submit} className="space-y-5">
        {mode === 'create' && (
          <Field
            name="id"
            label="ID (slug)"
            placeholder="the-saraa"
            required
            hint="зөвхөн жижиг үсэг, тоо, зураас"
          />
        )}

        <Field
          name="name"
          label="Нэр"
          defaultValue={initial?.name ?? ''}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Field
            name="price"
            label="Үнэ (₮)"
            type="number"
            defaultValue={initial?.price?.toString() ?? ''}
            required
          />
          <Field
            name="rating"
            label="Rating"
            type="number"
            step="0.1"
            defaultValue={initial?.rating?.toString() ?? ''}
          />
          <Field
            name="reviews"
            label="Reviews"
            type="number"
            defaultValue={initial?.reviews?.toString() ?? '0'}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Badge
          </label>
          <select
            name="badge"
            defaultValue={initial?.badge ?? ''}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          >
            {BADGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          name="tags"
          label="Tags (comma-separated)"
          placeholder="bouquet, hand-tied, peony, romance"
          defaultValue={(initial?.tags ?? []).join(', ')}
        />

        <Field
          name="occasion"
          label="Occasions (comma-separated)"
          placeholder="romance, birthday, just-because"
          defaultValue={(initial?.occasion ?? []).join(', ')}
        />

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Image prompt (AI generation)
          </label>
          <textarea
            name="img_prompt"
            value={imgPrompt}
            onChange={(e) => setImgPrompt(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            name="img_seed"
            label="Image seed"
            type="number"
            value={imgSeed.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setImgSeed(parseInt(e.target.value, 10) || 1000)
            }
          />
          <Field
            name="img_url"
            label="Image URL (override)"
            placeholder="https://..."
            defaultValue={initial?.img_url ?? ''}
            hint="хоосон бол Pollinations.ai-аас runtime татна"
          />
        </div>

        <div className="flex items-center gap-6">
          <Toggle
            name="pet_safe"
            label="🐾 Pet-safe"
            defaultChecked={initial?.pet_safe ?? false}
          />
          <Toggle
            name="active"
            label="Идэвхтэй"
            defaultChecked={initial?.active ?? true}
          />
        </div>

        {error && (
          <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending
              ? 'Хадгалж байна…'
              : mode === 'create'
                ? 'Үүсгэх'
                : 'Хадгалах'}
          </button>
          <Link href="/admin/products" className="btn-ghost">
            Цуцлах
          </Link>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isPending}
              className="ml-auto text-sm text-pinkHot hover:underline"
            >
              Устгах
            </button>
          )}
        </div>
      </form>

      <aside className="space-y-4">
        <div className="bg-white border border-border rounded-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-2">
            AI image preview
          </div>
          {previewUrl ? (
            <div className="relative aspect-square rounded bg-lilac/40 overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                sizes="320px"
                className="object-cover"
                unoptimized
                key={`${imgPrompt}-${imgSeed}`}
              />
            </div>
          ) : (
            <div className="aspect-square rounded bg-lilac/40 flex items-center justify-center text-ink/30 text-xs">
              Prompt оруулна уу
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  hint,
  defaultValue,
  value,
  step,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  value?: string;
  step?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
        {label}
        {required && <span className="text-pinkHot ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        step={step}
        onChange={onChange}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
      />
      {hint && <p className="text-xs text-ink/40 mt-1">{hint}</p>}
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="rounded border-border"
      />
      {label}
    </label>
  );
}
