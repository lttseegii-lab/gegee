'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { uploadProductImage } from '@/app/admin/products/actions';

const MAX = 4;

export function ProductGalleryUploader({ initialUrls }: { initialUrls: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls.slice(0, MAX));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    setError(null);
    if (urls.length >= MAX) {
      setError(`Хамгийн ихдээ ${MAX} зураг`);
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    startTransition(async () => {
      const res = await uploadProductImage(fd);
      if (res.error || !res.url) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      setUrls(prev => [...prev, res.url!].slice(0, MAX));
    });
  }

  function remove(i: number) {
    setUrls(prev => prev.filter((_, idx) => idx !== i));
  }

  function move(from: number, to: number) {
    setUrls(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
        Галерей — hover slider ({urls.length}/{MAX})
      </label>

      <input type="hidden" name="gallery_urls" value={JSON.stringify(urls)} />

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: MAX }, (_, i) => {
          const url = urls[i] ?? null;

          if (url) {
            return (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-lilac/40 group/slot">
                <Image
                  src={url}
                  alt={`Зураг ${i + 1}`}
                  fill
                  sizes="100px"
                  className="object-cover"
                  unoptimized
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-ink/60 text-white px-1 rounded">
                    үндсэн
                  </span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      className="w-6 h-6 rounded-full bg-white/90 text-ink text-xs flex items-center justify-center"
                      title="Зүүн тийш"
                    >←</button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="w-6 h-6 rounded-full bg-white/90 text-pinkHot text-xs flex items-center justify-center"
                    title="Устгах"
                  >✕</button>
                  {i < urls.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      className="w-6 h-6 rounded-full bg-white/90 text-ink text-xs flex items-center justify-center"
                      title="Баруун тийш"
                    >→</button>
                  )}
                </div>
              </div>
            );
          }

          if (i === urls.length) {
            return (
              <label
                key={i}
                className={`aspect-square rounded-lg border-2 border-dashed border-border hover:border-ink/40 cursor-pointer flex flex-col items-center justify-center transition-colors ${
                  isPending ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isPending}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />
                <span className="text-xl text-ink/30">{isPending ? '…' : '+'}</span>
              </label>
            );
          }

          return (
            <div
              key={i}
              className="aspect-square rounded-lg border border-dashed border-border/30 bg-offwhite"
            />
          );
        })}
      </div>

      {error && (
        <div className="text-[11px] text-pinkHot bg-blush rounded px-2 py-1 mt-1.5">
          {error}
        </div>
      )}
      <p className="text-xs text-ink/40 mt-1.5">
        Hover дээр слайд хийнэ. Эхний зураг үндсэн болно. ← → дарж дараалал өөрчилнө.
      </p>
    </div>
  );
}
