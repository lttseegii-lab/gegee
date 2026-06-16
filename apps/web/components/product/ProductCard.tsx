'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { productImageUrls } from '@/lib/ai/pollinations';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { HeartButton } from '@/components/product/HeartButton';
import type { Product } from '@/types/database';

const BADGE_STYLES: Record<string, string> = {
  'top-pick': 'bg-pinkHot text-white',
  'new-pill': 'bg-yellow text-ink',
  'letterbox-pill': 'bg-purpleSoft text-ink',
  'double-points': 'bg-mint text-ink',
};

const BADGE_LABELS: Record<string, string> = {
  'top-pick': 'Top Pick',
  'new-pill': 'Шинэ',
  'letterbox-pill': 'Letterbox',
  'double-points': 'Double Points',
};

export function ProductCard({ product }: { product: Product }) {
  const images = productImageUrls(product, 4);
  const multi = images.length > 1;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const stars = '★'.repeat(Math.floor(product.rating ?? 0));

  useEffect(() => {
    if (hovered && multi) {
      timerRef.current = setInterval(
        () => setIndex(i => (i + 1) % images.length),
        900
      );
    } else {
      clearInterval(timerRef.current);
      if (!hovered) setIndex(0);
    }
    return () => clearInterval(timerRef.current);
  }, [hovered, multi, images.length]);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block rounded-card overflow-hidden bg-white border border-border hover:shadow-card transition-shadow"
    >
      <div
        className="relative aspect-square bg-lilac/40 overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* each image is absolutely stacked and slides via translateX */}
        {images.map((url, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(${(i - index) * 100}%)` }}
          >
            <Image
              src={url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              unoptimized={url.includes('pollinations.ai')}
              priority={i === 0}
            />
          </div>
        ))}

        {/* badge */}
        {product.badge && BADGE_LABELS[product.badge] && (
          <span
            className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
              BADGE_STYLES[product.badge] ?? 'bg-ink text-white'
            }`}
          >
            {BADGE_LABELS[product.badge]}
          </span>
        )}

        {/* pet-safe */}
        {product.pet_safe && (
          <span className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-full text-[10px] font-medium bg-white/90 text-ink">
            🐾 Pet-safe
          </span>
        )}

        {/* heart */}
        <div className="absolute top-3 right-3 z-10">
          <HeartButton productId={product.id} size="sm" />
        </div>

        {/* dot indicators — only for multi-image products */}
        {multi && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {images.map((_, i) => (
              <button
                key={i}
                aria-label={`Зураг ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                }`}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg leading-tight group-hover:text-pinkHot transition-colors">
          {product.name}
        </h3>
        <div className="mt-1.5 text-xs text-ink/60 flex items-center gap-1.5">
          <span className="text-goldDeep">{stars}</span>
          <span>
            {product.rating?.toFixed(1) ?? '—'} · {(product.reviews ?? 0).toLocaleString()} review
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-ink/40 mr-1">эхлэл</span>
            <span className="font-semibold">{product.price.toLocaleString()}₮</span>
          </div>
          <AddToCartButton productId={product.id} variant="icon" />
        </div>
      </div>
    </Link>
  );
}
