'use client';

import { useRef, useState, useTransition } from 'react';
import {
  updateHeroBanners,
  resetHeroBanners,
  uploadHeroBanner,
} from '@/app/admin/theme/actions';
import {
  DEFAULT_HERO_BANNERS,
  type HeroBannerConfig,
  type HeroBanner,
} from '@/lib/theme/palette';

const EMPTY_SLIDE: HeroBanner = {
  image_url: '',
  heading: '',
  subheading: '',
};

export function HeroBannersPicker({
  initial,
}: {
  initial: HeroBannerConfig;
}) {
  const [config, setConfig] = useState<HeroBannerConfig>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateSlide(idx: number, patch: Partial<HeroBanner>) {
    setSavedMsg(null);
    setConfig((prev) => {
      const slides = [...prev.slides];
      slides[idx] = { ...slides[idx], ...patch };
      return { ...prev, slides };
    });
  }

  function addSlide() {
    setSavedMsg(null);
    setConfig((prev) => ({
      ...prev,
      slides: [...prev.slides, { ...EMPTY_SLIDE }],
    }));
  }

  function removeSlide(idx: number) {
    setSavedMsg(null);
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== idx),
    }));
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    setSavedMsg(null);
    setConfig((prev) => {
      const slides = [...prev.slides];
      const target = idx + dir;
      if (target < 0 || target >= slides.length) return prev;
      [slides[idx], slides[target]] = [slides[target], slides[idx]];
      return { ...prev, slides };
    });
  }

  function setInterval(ms: number) {
    setSavedMsg(null);
    setConfig((prev) => ({ ...prev, interval_ms: ms }));
  }

  function onSubmit() {
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await updateHeroBanners(config);
      if (res.error) setError(res.error);
      else setSavedMsg('Хадгалагдсан');
    });
  }

  function onReset() {
    if (!confirm('Default banner-руу буцаах уу?')) return;
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await resetHeroBanners();
      if (res.error) setError(res.error);
      else {
        setConfig(DEFAULT_HERO_BANNERS);
        setSavedMsg('Default-руу буцаасан');
      }
    });
  }

  return (
    <div className="space-y-5">
      {config.slides.map((slide, idx) => (
        <SlideEditor
          key={idx}
          slide={slide}
          idx={idx}
          total={config.slides.length}
          disabled={isPending}
          onChange={(patch) => updateSlide(idx, patch)}
          onRemove={() => removeSlide(idx)}
          onMove={(dir) => moveSlide(idx, dir)}
        />
      ))}

      <button
        type="button"
        onClick={addSlide}
        disabled={isPending || config.slides.length >= 6}
        className="w-full border-2 border-dashed border-border rounded-card py-6 text-sm text-ink/60 hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
      >
        + Шинэ banner нэмэх ({config.slides.length} / 6)
      </button>

      <div className="bg-white border border-border rounded-card p-5">
        <label className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-sm">Auto-rotate интервал</div>
            <div className="text-xs text-ink/50">
              Хэдэн миллисекундэд нэг banner солих вэ (0 = solihgüi)
            </div>
          </div>
          <input
            type="number"
            min={0}
            max={60000}
            step={500}
            value={config.interval_ms}
            onChange={(e) => setInterval(parseInt(e.target.value, 10) || 0)}
            disabled={isPending}
            className="w-28 bg-offwhite border border-border rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-ink"
          />
        </label>
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

function SlideEditor({
  slide,
  idx,
  total,
  disabled,
  onChange,
  onRemove,
  onMove,
}: {
  slide: HeroBanner;
  idx: number;
  total: number;
  disabled: boolean;
  onChange: (patch: Partial<HeroBanner>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadHeroBanner(fd);
      if (res.error) {
        setUploadError(res.error);
      } else if (res.url) {
        onChange({ image_url: res.url });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="bg-white border border-border rounded-card p-5 grid lg:grid-cols-[260px_1fr] gap-5">
      {/* Preview + image input */}
      <div className="space-y-3">
        <div className="relative aspect-[4/3] rounded-lg bg-blush overflow-hidden flex items-center justify-center text-pinkHot text-5xl">
          {slide.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image_url}
              alt={slide.heading || `Banner ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>✻</span>
          )}
        </div>

        <input
          type="url"
          value={slide.image_url}
          onChange={(e) => onChange({ image_url: e.target.value })}
          disabled={disabled || uploading}
          placeholder="https://… (URL)"
          className="w-full bg-offwhite border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-ink"
        />

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            disabled={disabled || uploading}
            className="hidden"
            id={`upload-${idx}`}
          />
          <label
            htmlFor={`upload-${idx}`}
            className={`flex-1 text-xs px-3 py-2 rounded-lg border border-border text-center cursor-pointer hover:border-ink transition-colors ${
              disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Upload-лож байна…' : '📤 Файл сонгох'}
          </label>
          {slide.image_url && (
            <button
              type="button"
              onClick={() => onChange({ image_url: '' })}
              disabled={disabled || uploading}
              className="text-xs px-3 py-2 rounded-lg border border-border hover:border-pinkHot hover:text-pinkHot transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {uploadError && (
          <div className="text-xs text-pinkHot bg-blush rounded px-2 py-1">
            {uploadError}
          </div>
        )}
      </div>

      {/* Heading + subheading */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-ink/50">
            Banner {idx + 1} / {total}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={disabled || idx === 0}
              className="w-7 h-7 rounded-full border border-border hover:border-ink disabled:opacity-30 text-xs"
              aria-label="Дээш"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={disabled || idx === total - 1}
              className="w-7 h-7 rounded-full border border-border hover:border-ink disabled:opacity-30 text-xs"
              aria-label="Доош"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="w-7 h-7 rounded-full border border-border hover:border-pinkHot hover:text-pinkHot text-xs ml-2"
              aria-label="Устгах"
            >
              ✕
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-ink/50 mb-1.5">
            Гарчиг
          </label>
          <input
            type="text"
            value={slide.heading}
            onChange={(e) => onChange({ heading: e.target.value })}
            disabled={disabled}
            maxLength={120}
            placeholder="Цэцэг илгээ. Урлагийг задал."
            className="w-full bg-offwhite border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-ink/50 mb-1.5">
            Товч тайлбар
          </label>
          <textarea
            value={slide.subheading}
            onChange={(e) => onChange({ subheading: e.target.value })}
            disabled={disabled}
            rows={3}
            maxLength={400}
            placeholder="AI чиний хайр, баяр…"
            className="w-full bg-offwhite border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink resize-none"
          />
          <div className="text-xs text-ink/40 mt-1">
            {slide.subheading.length} / 400
          </div>
        </div>
      </div>
    </div>
  );
}
