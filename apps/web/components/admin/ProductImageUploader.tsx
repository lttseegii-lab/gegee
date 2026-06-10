'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { uploadProductImage } from '@/app/admin/products/actions';

/**
 * Product image input — upload a file instead of pasting a URL. The uploaded
 * public URL is carried into the form via a hidden `img_url` field (the server
 * action reads it unchanged). Empty ⇒ falls back to Pollinations at runtime.
 */
export function ProductImageUploader({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const res = await uploadProductImage(fd);
      if (res.error || !res.url) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      setUrl(res.url);
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
        Зураг
      </label>

      {/* Carries the URL into the product form submit */}
      <input type="hidden" name="img_url" value={url} />

      {url ? (
        <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-border bg-lilac/40">
          <Image
            src={url}
            alt="Бүтээгдэхүүний зураг"
            fill
            sizes="200px"
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => setUrl('')}
            aria-label="Зураг устгах"
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-ink/70 flex items-center justify-center text-sm shadow-sm"
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          className={`block w-full max-w-[200px] aspect-square rounded-lg border-2 border-dashed border-border hover:border-ink/40 cursor-pointer flex flex-col items-center justify-center text-center p-3 transition-colors ${
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
          <div className="text-2xl mb-1.5">📷</div>
          <div className="text-xs text-ink/60">
            {isPending ? 'Илгээж байна…' : 'Зураг оруулах'}
          </div>
          <div className="text-[10px] text-ink/40 mt-1">JPG · PNG · 10MB</div>
        </label>
      )}

      {error && (
        <div className="text-[11px] text-pinkHot bg-blush rounded px-2 py-1 mt-1.5 max-w-[200px]">
          {error}
        </div>
      )}
      <p className="text-xs text-ink/40 mt-1.5">
        Хоосон бол Pollinations.ai-аас зураг үүснэ
      </p>
    </div>
  );
}
