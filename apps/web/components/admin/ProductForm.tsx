'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition, useMemo } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/admin/products/actions';
import { aiImageUrl } from '@/lib/ai/pollinations';
import { ProductImageUploader } from './ProductImageUploader';
import { ProductGalleryUploader } from './ProductGalleryUploader';
import type { Product } from '@/types/database';
import type {
  MenuSubcategoriesMap,
  CategoryKey,
} from '@/lib/theme/palette';

const BADGE_OPTIONS = [
  { value: '', label: '— Байхгүй —' },
  { value: 'top-pick', label: 'Top Pick' },
  { value: 'new-pill', label: 'Шинэ' },
  { value: 'letterbox-pill', label: 'Letterbox' },
  { value: 'double-points', label: 'Double Points' },
];

const CATEGORY_LABELS: Record<CategoryKey, { icon: string; label: string }> = {
  flowers: { icon: '🌸', label: 'Цэцэг' },
  plants: { icon: '🪴', label: 'Ургамал' },
  gifts: { icon: '🎁', label: 'Бэлэг' },
  cards: { icon: '💌', label: 'Карт' },
  subs: { icon: '📦', label: 'Захиалгат' },
};

export function ProductForm({
  initial,
  mode,
  subcategories,
}: {
  initial?: Partial<Product>;
  mode: 'create' | 'edit';
  subcategories: MenuSubcategoriesMap;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [imgPrompt, setImgPrompt] = useState(initial?.img_prompt ?? '');
  const [imgSeed, setImgSeed] = useState<number>(initial?.img_seed ?? 1000);

  // Manage tags as state so we can sync subcategory checkboxes ↔ tags input
  const initialTagsArr = initial?.tags ?? [];
  const [tagsInput, setTagsInput] = useState<string>(initialTagsArr.join(', '));

  const currentTags = useMemo(() => {
    return tagsInput
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsInput]);

  function toggleTag(tag: string) {
    const set = new Set(currentTags);
    if (set.has(tag)) set.delete(tag);
    else set.add(tag);
    setTagsInput(Array.from(set).join(', '));
  }

  // Flatten all subcategories per category for the picker UI
  const subsByCategory = useMemo(() => {
    return (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => ({
      cat,
      items: subcategories[cat] ?? [],
    }));
  }, [subcategories]);

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            name="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="bouquet, hand-tied, peony, romance"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
          <p className="text-xs text-ink/40 mt-1">
            Доорх дэд цэсний сонголтыг солихоор шинэчлэгдэнэ
          </p>
        </div>

        {/* Sub-category multi-select — toggling checkbox modifies tags */}
        <div className="bg-offwhite border border-border rounded-card p-4">
          <h3 className="text-xs uppercase tracking-wider text-ink/60 mb-3">
            Дэд цэсэнд нэмэх
          </h3>
          <p className="text-xs text-ink/50 mb-4">
            Тухайн дэд цэсэнд харагдуулахын тулд сонгоно уу. Сонгомогц
            tags-руу автоматаар нэмэгдэнэ.
          </p>
          <div className="space-y-4">
            {subsByCategory.map(({ cat, items }) => {
              if (items.length === 0) return null;
              const meta = CATEGORY_LABELS[cat];
              return (
                <div key={cat}>
                  <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-2">
                    {meta.icon} {meta.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((sub) => {
                      const checked = currentTags.includes(sub.tag);
                      return (
                        <button
                          key={`${cat}-${sub.key}`}
                          type="button"
                          onClick={() => toggleTag(sub.tag)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            checked
                              ? 'bg-ink text-white border-ink'
                              : 'bg-white text-ink border-border hover:border-ink'
                          }`}
                        >
                          {checked && <span>✓</span>}
                          {sub.label}
                          <span
                            className={`text-[10px] font-mono ${
                              checked ? 'text-white/60' : 'text-ink/40'
                            }`}
                          >
                            {sub.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Field
            name="img_seed"
            label="Image seed"
            type="number"
            value={imgSeed.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setImgSeed(parseInt(e.target.value, 10) || 1000)
            }
          />
          <ProductImageUploader initialUrl={initial?.img_url ?? ''} />
        </div>

        <ProductGalleryUploader initialUrls={initial?.gallery_urls ?? []} />

        <div className="flex items-center gap-6 flex-wrap">
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

        <div className="bg-offwhite border border-border rounded-card p-4">
          <h3 className="text-xs uppercase tracking-wider text-ink/60 mb-3">
            Checkout funnel — upsell
          </h3>
          <div className="flex items-center gap-6 flex-wrap">
            <Toggle
              name="is_gift_upsell"
              label="🎁 Бэлэг алхамд харагдах"
              defaultChecked={initial?.is_gift_upsell ?? false}
            />
            <Toggle
              name="is_card_upsell"
              label="💌 Card алхамд харагдах"
              defaultChecked={initial?.is_card_upsell ?? false}
            />
          </div>
          <p className="text-xs text-ink/50 mt-2">
            Хэрэглэгч /checkout-ийн тухайн алхамд suggest-эж харах болно.
          </p>
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
