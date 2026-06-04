'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HeroBanner } from '@/lib/theme/palette';

export function HeroCarousel({
  slides,
  intervalMs,
}: {
  slides: HeroBanner[];
  intervalMs: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = slides.length;
  const canRotate = total > 1 && intervalMs > 0;

  const goTo = useCallback(
    (idx: number) => {
      if (total === 0) return;
      setActive(((idx % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (!canRotate || paused) return;
    timerRef.current = setTimeout(next, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, canRotate, paused, intervalMs, next]);

  if (total === 0) return null;

  return (
    <section
      className="bg-blush relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center relative">
        {/* Slides stack on the LEFT — text content */}
        <div className="relative min-h-[360px]">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              aria-hidden={idx !== active}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <p className="text-[13px] uppercase tracking-[0.2em] text-ink/60 mb-4">
                est. 2026
              </p>
              <h1 className="font-serif text-4xl lg:text-6xl leading-[1.05] text-ink whitespace-pre-line">
                {renderHeading(slide.heading)}
              </h1>
              {slide.subheading && (
                <p className="mt-6 text-ink/70 text-lg max-w-md whitespace-pre-line">
                  {slide.subheading}
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/recommend" className="btn-primary">
                  ✨ AI санал авах
                </Link>
                <Link href="/catalog/all" className="btn-ghost">
                  Цэцэг үзэх
                </Link>
                <Link href="/diy" className="btn-ghost">
                  Өөрийн гараар →
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-ink/60">
                <span>★ 4.9 / 5</span>
                <span>·</span>
                <span>12,000+ хэрэглэгч</span>
                <span>·</span>
                <span>B Corp</span>
              </div>
            </div>
          ))}
        </div>

        {/* Slides stack on the RIGHT — image */}
        <div className="relative aspect-square bg-white/40 rounded-card overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              aria-hidden={idx !== active}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === active ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {slide.image_url ? (
                // External URLs — bypass next/image to avoid host-allowlist config
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image_url}
                  alt={slide.heading || `Banner ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pinkHot text-9xl">
                  ✻
                </div>
              )}
            </div>
          ))}

          {/* Prev / next arrows — visible when there are 2+ slides */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Өмнөх"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-card flex items-center justify-center text-ink transition-all"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Дараагийн"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-card flex items-center justify-center text-ink transition-all"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Dot indicators — bottom center */}
        {total > 1 && (
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Banner ${idx + 1}`}
                aria-current={idx === active ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${
                  idx === active
                    ? 'bg-ink w-8'
                    : 'bg-ink/20 hover:bg-ink/40 w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Splits the heading into 2 lines if the user wrote "First. Second." style
 * so the italic emphasis pattern of the original heading still works.
 * Falls back to a single-line render if it's a simple heading.
 */
function renderHeading(heading: string): React.ReactNode {
  // If the heading has " . " split into two segments (rough heuristic),
  // render second segment in italic. Otherwise just render plain.
  const trimmed = heading.trim();
  const match = trimmed.match(/^(.+?\.)\s+(.+)$/);
  if (match) {
    return (
      <>
        {match[1]} <em className="font-serif italic">{match[2]}</em>
      </>
    );
  }
  return trimmed;
}
