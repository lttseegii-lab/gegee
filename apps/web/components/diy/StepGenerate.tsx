'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { generateVariants, type DiyVariant } from '@/lib/diy/aiGen';
import type { FlowerSelection, DiyFlower } from '@/lib/diy/flowers';
import type { DiyWrap } from '@/lib/diy/wraps';

interface Props {
  flowersByKey: Record<string, DiyFlower>;
  wrapsByKey: Record<string, DiyWrap>;
  selections: FlowerSelection[];
  wrapKey: string | null;
  selectedVariant: string | null;
  onSelectVariant: (variant: DiyVariant) => void;
}

export function StepGenerate({
  flowersByKey,
  wrapsByKey,
  selections,
  wrapKey,
  selectedVariant,
  onSelectVariant,
}: Props) {
  const variants = useMemo(
    () => generateVariants(selections, wrapKey, flowersByKey, wrapsByKey),
    [selections, wrapKey, flowersByKey, wrapsByKey]
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif italic text-2xl mb-2">3. AI 3 хувилбар үүсгэлээ</h2>
        <p className="text-sm text-ink/60">
          Аль нь танай зүрх сэтгэлийг татна вэ?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {variants.map((v) => {
          const active = selectedVariant === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => onSelectVariant(v)}
              className={`bg-white rounded-card overflow-hidden border-2 transition-all text-left ${
                active
                  ? 'border-ink shadow-card scale-[1.02]'
                  : 'border-border hover:border-ink/40 hover:-translate-y-0.5'
              }`}
            >
              <div className="relative aspect-square bg-lilac/40">
                <Image
                  src={v.imageUrl}
                  alt={v.styleName}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
                {active && (
                  <div className="absolute top-3 right-3 bg-ink text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-1">{v.styleName}</h3>
                <p className="text-[11px] text-ink/50 truncate">
                  seed {v.seed}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink/40 mt-6 text-center">
        🌸 AI зургийг 5-10 секундын дотор үүсгэх боломжтой. Алхамыг түр хүлээнэ үү.
      </p>
    </div>
  );
}
