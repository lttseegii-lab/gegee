'use client';

import { useRef, useState, useTransition } from 'react';
import {
  updateOnboardingFlowers,
  resetOnboardingFlowers,
  uploadOnboardingFlower,
} from '@/app/admin/theme/actions';
import {
  ONBOARDING_FLOWERS,
  type OnboardingFlower,
} from '@/lib/onboarding-flowers';
import { ImageCropModal } from './ImageCropModal';

/**
 * Admin editor for the 10 onboarding-flower cards shown on
 * /onboarding?step=mood. Image, label, description are editable.
 * Key, emoji, tint stay locked to the static defaults so avatars
 * keep rendering consistently.
 *
 * Initial = resolved flowers (defaults + admin overrides merged).
 */
export function OnboardingFlowersPicker({
  initial,
}: {
  initial: OnboardingFlower[];
}) {
  const [flowers, setFlowers] = useState<OnboardingFlower[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(idx: number, patch: Partial<OnboardingFlower>) {
    setSavedMsg(null);
    setFlowers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function onSubmit() {
    setError(null);
    setSavedMsg(null);
    // Only send the editable fields; key identifies each row.
    const payload = flowers.map((f) => ({
      key: f.key,
      image_url: f.image_url,
      label: f.label,
      description: f.description,
    }));
    startTransition(async () => {
      const res = await updateOnboardingFlowers(payload);
      if (res.error) setError(res.error);
      else setSavedMsg('Хадгалагдсан — frontend-д шинэчлэгдэнэ');
    });
  }

  function onReset() {
    if (!confirm('Default цэцгүүдийн зураг, нэр, тайлбар руу буцах уу?'))
      return;
    setError(null);
    setSavedMsg(null);
    startTransition(async () => {
      const res = await resetOnboardingFlowers();
      if (res.error) setError(res.error);
      else {
        setFlowers(ONBOARDING_FLOWERS);
        setSavedMsg('Default-руу буцаасан');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {flowers.map((f, idx) => (
          <FlowerEditor
            key={f.key}
            flower={f}
            disabled={isPending}
            onChange={(patch) => update(idx, patch)}
          />
        ))}
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

function FlowerEditor({
  flower,
  disabled,
  onChange,
}: {
  flower: OnboardingFlower;
  disabled: boolean;
  onChange: (patch: Partial<OnboardingFlower>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setPickedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadCropped(blob: Blob) {
    setPickedFile(null);
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      const file = new File([blob], `flower-${flower.key}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      fd.append('file', file);
      const res = await uploadOnboardingFlower(fd);
      if (res.error) setUploadError(res.error);
      else if (res.url) onChange({ image_url: res.url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-card p-4 space-y-3">
      {/* Preview */}
      <div
        className={`relative aspect-square ${flower.tintClass} rounded-lg overflow-hidden`}
      >
        {flower.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flower.image_url}
            alt={flower.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {flower.emoji}
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/85 backdrop-blur text-[10px] uppercase tracking-wider text-ink/60 px-2 py-1 rounded">
          {flower.key}
        </span>
      </div>

      {/* Label + description */}
      <div className="space-y-2">
        <input
          type="text"
          value={flower.label}
          onChange={(e) => onChange({ label: e.target.value })}
          disabled={disabled}
          maxLength={40}
          placeholder="Цэцгийн нэр"
          className="w-full bg-offwhite border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-ink"
        />
        <input
          type="text"
          value={flower.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          maxLength={120}
          placeholder="Богино тайлбар"
          className="w-full bg-offwhite border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ink"
        />
      </div>

      {/* Image URL + upload */}
      <div className="space-y-2">
        <input
          type="url"
          value={flower.image_url}
          onChange={(e) => onChange({ image_url: e.target.value })}
          disabled={disabled || uploading}
          placeholder="https://… (зургийн URL)"
          className="w-full bg-offwhite border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-ink"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={disabled || uploading}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full text-xs px-3 py-2 rounded-lg border border-border text-center hover:border-ink transition-colors disabled:opacity-50"
        >
          {uploading ? 'Upload-лож байна…' : '📤 Файл сонгож crop хийх'}
        </button>
        {uploadError && (
          <div className="text-xs text-pinkHot bg-blush rounded px-2 py-1">
            {uploadError}
          </div>
        )}
      </div>

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
