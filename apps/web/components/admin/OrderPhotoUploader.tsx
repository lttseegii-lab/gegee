'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import {
  uploadOrderPhoto,
  removeOrderPhoto,
} from '@/app/admin/orders/actions';

interface Props {
  orderId: number;
  slot: 'prep' | 'delivery';
  label: string;
  initialUrl: string | null;
}

export function OrderPhotoUploader({
  orderId,
  slot,
  label,
  initialUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const res = await uploadOrderPhoto(orderId, slot, fd);
      if (!res.ok) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      setUrl(res.url ?? null);
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  function handleRemove() {
    if (!confirm('Зургийг устгах уу?')) return;
    setError(null);
    startTransition(async () => {
      const res = await removeOrderPhoto(orderId, slot);
      if (!res.ok) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      setUrl(null);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-ink/50">
          {label}
        </span>
        {url && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="text-[11px] text-ink/40 hover:text-pinkHot"
          >
            Устгах
          </button>
        )}
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block w-full aspect-square rounded-lg overflow-hidden bg-lilac/40 hover:ring-2 hover:ring-ink/20 transition-shadow"
        >
          <Image
            src={url}
            alt={label}
            fill
            sizes="200px"
            className="object-cover"
          />
        </a>
      ) : (
        <label
          className={`block w-full aspect-square rounded-lg border-2 border-dashed border-border hover:border-ink/40 cursor-pointer flex flex-col items-center justify-center text-center p-3 transition-colors ${
            isPending ? 'opacity-50' : ''
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={isPending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="text-2xl mb-1.5">📸</div>
          <div className="text-xs text-ink/60">
            {isPending ? 'Илгээж байна…' : 'Зураг сонгох'}
          </div>
          <div className="text-[10px] text-ink/40 mt-1">JPG · PNG · 10MB</div>
        </label>
      )}

      {error && (
        <div className="text-[11px] text-pinkHot bg-blush rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
