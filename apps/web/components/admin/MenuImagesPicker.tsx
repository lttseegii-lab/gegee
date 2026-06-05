'use client';

import { useRef, useState, useTransition } from 'react';
import {
  updateMenuImages,
  resetMenuImages,
  uploadMegaImage,
} from '@/app/admin/theme/actions';
import {
  IMAGE_GRADIENTS,
  resolveGradient,
  DEFAULT_MENU_IMAGES,
  type MenuImagesMap,
  type CategoryKey,
  type MegaImageConfig,
} from '@/lib/theme/palette';
import { ImageCropModal } from './ImageCropModal';

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
    patch: Partial<MegaImageConfig>
  ) {
    setSavedMsg(null);
    setImages((prev) => {
      const current = [...(prev[cat] ?? [])];
      current[idx] = { ...current[idx], ...patch };
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
                    onChange={(patch) => updateCard(cat, idx, patch)}
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
  onChange: (patch: Partial<MegaImageConfig>) => void;
}) {
  const gradient = resolveGradient(card.gradient);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const hasImage = !!card.image_url;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    // Open crop modal — actual upload happens after crop is confirmed
    setPickedFile(file);
    // Clear the input so the SAME file can be re-picked after cancel
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadCropped(blob: Blob) {
    setPickedFile(null);
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      // Cropped output is always JPEG (from ImageCropModal canvas.toBlob)
      const file = new File([blob], `mega-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      fd.append('file', file);
      const res = await uploadMegaImage(fd);
      if (res.error) {
        setUploadError(res.error);
      } else if (res.url) {
        onChange({ image_url: res.url });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-offwhite rounded-card p-4 space-y-3">
      {/* Preview — show photo if uploaded, else emoji + gradient */}
      <div
        className={`relative aspect-[4/3] ${hasImage ? 'bg-ink/5' : gradient.bgClass} rounded-lg flex items-center justify-center text-5xl overflow-hidden`}
      >
        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image_url}
              alt={card.label || 'preview'}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange({ image_url: '' })}
              disabled={disabled || uploading}
              aria-label="Зураг арилгах"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-ink text-sm shadow-card flex items-center justify-center"
            >
              ✕
            </button>
          </>
        ) : (
          <span>{card.emoji || '·'}</span>
        )}
      </div>

      {/* URL + Upload row */}
      <div className="space-y-2">
        <input
          type="url"
          value={card.image_url ?? ''}
          onChange={(e) => onChange({ image_url: e.target.value })}
          disabled={disabled || uploading}
          placeholder="https://… (зургийн URL)"
          className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-ink"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={disabled || uploading}
          className="hidden"
          id={`mega-upload-${Math.random().toString(36).slice(2, 8)}`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full text-xs px-3 py-2 rounded-lg border border-border text-center hover:border-ink transition-colors disabled:opacity-50"
        >
          {uploading ? 'Upload-лож байна…' : '📤 Файл сонгох'}
        </button>
        {uploadError && (
          <div className="text-xs text-pinkHot bg-blush rounded px-2 py-1">
            {uploadError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[60px_1fr] gap-2">
        <input
          type="text"
          value={card.emoji}
          onChange={(e) => onChange({ emoji: e.target.value })}
          disabled={disabled}
          maxLength={4}
          placeholder="🌸"
          title="Зураг ороогүй үед харагдах emoji"
          className="bg-white border border-border rounded-lg px-2 py-2 text-2xl text-center focus:outline-none focus:border-ink"
        />
        <input
          type="text"
          value={card.label}
          onChange={(e) => onChange({ label: e.target.value })}
          disabled={disabled}
          maxLength={40}
          placeholder="Card гарчиг"
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </div>

      <input
        type="text"
        value={card.href}
        onChange={(e) => onChange({ href: e.target.value })}
        disabled={disabled}
        placeholder="/catalog/flowers"
        className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-ink"
      />

      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink/50 mb-1.5">
          Background (зураггүй үеийн)
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {IMAGE_GRADIENTS.map((g) => (
            <button
              key={g.key}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ gradient: g.key })}
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

      {/* Crop modal — appears after a file is picked, before upload */}
      <ImageCropModal
        file={pickedFile}
        aspect={1}
        outputSize={800}
        onCancel={() => setPickedFile(null)}
        onConfirm={uploadCropped}
      />
    </div>
  );
}
