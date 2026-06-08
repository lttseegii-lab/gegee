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
      className="relative w-full overflow-hidden bg-blush"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Нүүр banner"
    >
      {/* Full-width image stack */}
      <div className="relative w-full h-[clamp(420px,62vh,720px)]">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            aria-hidden={idx !== active}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {slide.image_url ? (
              <>
                {/* External URLs — bypass next/image to avoid host-allowlist config */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image_url}
                  alt={slide.heading || `Banner ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
                {/* Readability overlay — darken bottom + right where text sits */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none lg:hidden"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full bg-blush flex items-center justify-center text-pinkHot text-[18vw] sm:text-[12vw] lg:text-[10vw]">
                ✻
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Text overlay — pinned to the right (or centered on mobile) */}
      <div className="absolute inset-0 flex items-center justify-center lg:justify-end pointer-events-none">
        <div className="max-w-container w-full px-6 lg:px-12 flex justify-center lg:justify-end">
          <div className="relative max-w-xl text-center lg:text-right pointer-events-auto">
            {slides.map((slide, idx) => {
              const isActive = idx === active;
              const textColor = slide.image_url ? 'text-white' : 'text-ink';
              return (
                <div
                  key={idx}
                  aria-hidden={!isActive}
                  className={`${
                    isActive
                      ? 'relative opacity-100'
                      : 'absolute inset-0 opacity-0 pointer-events-none'
                  } transition-opacity duration-700`}
                >
                  <p
                    className={`text-[11px] uppercase tracking-[0.25em] mb-3 ${
                      slide.image_url ? 'text-white/80' : 'text-ink/60'
                    }`}
                  >
                    est. 2026
                  </p>
                  <h1
                    className={`font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] ${textColor} drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] whitespace-pre-line`}
                  >
                    {renderHeading(slide.heading)}
                  </h1>
                  {slide.subheading && (
                    <p
                      className={`mt-5 text-base sm:text-lg max-w-md mx-auto lg:ml-auto lg:mr-0 ${
                        slide.image_url
                          ? 'text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                          : 'text-ink/70'
                      } whitespace-pre-line`}
                    >
                      {slide.subheading}
                    </p>
                  )}
                  <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-end gap-3">
                    <Link
                      href="/recommend"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-ink text-white font-medium text-sm transition-colors hover:bg-pinkHot"
                    >
                      ✨ AI туслуулах
                    </Link>
                    <Link
                      href="/catalog/all"
                      className={`inline-flex items-center justify-center px-6 py-3 rounded-full border font-medium text-sm transition-colors ${
                        slide.image_url
                          ? 'bg-white/90 border-white text-ink hover:bg-white'
                          : 'border-border text-ink hover:border-ink'
                      }`}
                    >
                      Цэцэг үзэх
                    </Link>
                    <Link
                      href="/diy"
                      className={`text-sm font-medium transition-colors ${
                        slide.image_url
                          ? 'text-white hover:text-pinkHot drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                          : 'text-ink hover:text-pinkHot'
                      }`}
                    >
                      DIY →
                    </Link>
                  </div>
                  <div
                    className={`mt-7 flex items-center justify-center lg:justify-end gap-4 text-xs sm:text-sm ${
                      slide.image_url ? 'text-white/80' : 'text-ink/60'
                    }`}
                  >
                    <span>★ 4.9 / 5</span>
                    <span className="opacity-50">·</span>
                    <span>12,000+ хэрэглэгч</span>
                    <span className="opacity-50 hidden sm:inline">·</span>
                    <span className="hidden sm:inline">B Corp</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prev / next arrows — visible when there are 2+ slides */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Өмнөх"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur hover:bg-white shadow-card flex items-center justify-center text-ink transition-all z-10"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Дараагийн"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/85 backdrop-blur hover:bg-white shadow-card flex items-center justify-center text-ink transition-all z-10"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators — bottom center */}
      {total > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Banner ${idx + 1}`}
              aria-current={idx === active ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${
                idx === active
                  ? 'bg-white w-8 shadow'
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Splits the heading into 2 lines if the user wrote "First. Second." style
 * so the italic emphasis pattern of the original heading still works.
 * Falls back to a single-line render if it's a simple heading.
 */
function renderHeading(heading: string): React.ReactNode {
  const trimmed = heading.trim();
  const match = trimmed.match(/^(.+?\.)\s+(.+)$/);
  if (match) {
    return (
      <>
        {match[1]}{' '}
        <em className="font-serif italic">{match[2]}</em>
      </>
    );
  }
  return trimmed;
}
