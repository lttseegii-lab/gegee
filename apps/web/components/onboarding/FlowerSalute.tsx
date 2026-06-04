'use client';

import { useEffect, useMemo, useState } from 'react';

const FLOWERS = ['🌸', '🌷', '🌹', '🌺', '🌻', '🌼', '💐', '✨', '🎉', '🌿'];

interface Drop {
  emoji: string;
  left: number; // 0..100 (%)
  delay: number; // seconds
  duration: number; // seconds
  rotate: number; // total rotation in deg
  size: number; // font-size in px
  sway: number; // horizontal sway px
}

/**
 * Full-screen falling-flower celebration overlay.
 *
 * Renders absolutely over the page with pointer-events disabled, so it
 * never blocks clicks on the underlying CTAs. After ~6 seconds, the drops
 * naturally end (animation runs once); for added safety we then unmount.
 */
export function FlowerSalute({
  count = 40,
  durationMs = 6500,
}: {
  count?: number;
  durationMs?: number;
}) {
  const [active, setActive] = useState(true);

  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: count }, () => ({
      emoji: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 3 + Math.random() * 2.5,
      rotate: (Math.random() - 0.5) * 720,
      size: 22 + Math.random() * 28,
      sway: (Math.random() - 0.5) * 120,
    }));
  }, [count]);

  useEffect(() => {
    const t = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(t);
  }, [durationMs]);

  if (!active) return null;

  return (
    <>
      <style jsx>{`
        @keyframes flowerFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--sway), 110vh, 0)
              rotate(var(--rotate));
            opacity: 0;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-40"
      >
        {drops.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 will-change-transform"
            style={{
              left: `${d.left}%`,
              fontSize: `${d.size}px`,
              animation: `flowerFall ${d.duration}s ${d.delay}s ease-in forwards`,
              ['--sway' as string]: `${d.sway}px`,
              ['--rotate' as string]: `${d.rotate}deg`,
            }}
          >
            {d.emoji}
          </span>
        ))}
      </div>
    </>
  );
}
