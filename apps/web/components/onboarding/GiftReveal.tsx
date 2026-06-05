'use client';

import { useState } from 'react';
import { FlowerSalute } from './FlowerSalute';

/**
 * Interactive welcome-gift reveal shown on the onboarding "done" step.
 *
 * Starts as a closed, tappable gift box ("Бэлгийн хайрцаг дээр дарна уу").
 * When the user taps it the points are unveiled with a celebratory flourish
 * and a falling-flower salute fires.
 */
export function GiftReveal({ bonusPoints }: { bonusPoints: number }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="mb-6 flex flex-col items-center">
      {opened && <FlowerSalute />}

      {!opened ? (
        <button
          type="button"
          onClick={() => setOpened(true)}
          aria-label="Бэлгийн хайрцгийг нээх"
          className="group flex flex-col items-center gap-3 outline-none"
        >
          <span className="inline-block transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
            <span className="gift-bounce inline-block text-7xl drop-shadow-sm">
              🎁
            </span>
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-pinkHot animate-pulse">
            Бэлгийн хайрцаг дээр дарна уу
          </span>
        </button>
      ) : (
        <div className="gift-reveal inline-flex items-center gap-4 bg-gradient-to-r from-pinkHot/15 via-yellow-pale to-mint/40 border border-pinkHot/30 rounded-[24px] px-6 py-4 shadow-card">
          <span className="text-4xl">🎉</span>
          <div className="text-left leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-ink/60">
              Таньд
            </div>
            <div className="font-serif italic text-3xl text-ink">
              {bonusPoints.toLocaleString()} оноо
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink/60">
              бэлэглэж байна
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .gift-bounce {
          animation: giftBounce 1.4s ease-in-out infinite;
        }
        @keyframes giftBounce {
          0%,
          100% {
            transform: translateY(0) rotate(-4deg);
          }
          25% {
            transform: translateY(-7px) rotate(4deg);
          }
          50% {
            transform: translateY(0) rotate(-4deg);
          }
          75% {
            transform: translateY(-3px) rotate(2deg);
          }
        }
        .gift-reveal {
          animation: giftReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes giftReveal {
          0% {
            transform: scale(0.6) translateY(12px);
            opacity: 0;
          }
          60% {
            transform: scale(1.06);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
