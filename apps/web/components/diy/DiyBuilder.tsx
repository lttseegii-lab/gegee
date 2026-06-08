'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StepFlowers } from './StepFlowers';
import { StepWrap } from './StepWrap';
import { StepGenerate } from './StepGenerate';
import { calculatePrice } from '@/lib/diy/pricing';
import {
  diyFlowersByKey,
  totalStems,
  type DiyFlower,
  type FlowerSelection,
} from '@/lib/diy/flowers';
import { diyWrapsByKey, type DiyWrap } from '@/lib/diy/wraps';
import type { DiyVariant } from '@/lib/diy/aiGen';
import { createDiyAndAddToCart } from '@/app/(shop)/diy/actions';
import { useCartStore } from '@/stores/cartStore';

type Step = 1 | 2 | 3;

export function DiyBuilder({
  flowers,
  wraps,
}: {
  flowers: DiyFlower[];
  wraps: DiyWrap[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selections, setSelections] = useState<FlowerSelection[]>([]);
  const [wrapKey, setWrapKey] = useState<string | null>(null);
  const [variant, setVariant] = useState<DiyVariant | null>(null);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const openCart = useCartStore((s) => s.open);

  const flowersByKey = useMemo(() => diyFlowersByKey(flowers), [flowers]);
  const wrapsByKey = useMemo(() => diyWrapsByKey(wraps), [wraps]);

  const stems = totalStems(selections);
  const pricing = calculatePrice(selections, wrapKey, flowersByKey, wrapsByKey);

  const canGoStep2 = stems > 0;
  const canGoStep3 = canGoStep2 && wrapKey !== null;
  const canFinish = variant !== null;

  function next() {
    setError(null);
    if (step === 1 && !canGoStep2) {
      setError('Хамгийн багадаа нэг цэцэг сонгоно уу');
      return;
    }
    if (step === 2 && !canGoStep3) {
      setError('Боолтоо сонгоно уу');
      return;
    }
    setStep((s) => (s + 1) as Step);
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  function finish() {
    if (!variant) return;
    setError(null);
    startTransition(async () => {
      const res = await createDiyAndAddToCart({
        selections,
        wrapKey,
        variantKey: variant.key,
        variantName: variant.styleName,
        imageUrl: variant.imageUrl,
        prompt: variant.prompt,
        seed: variant.seed,
        customName: customName.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      // Refresh cart from server + open drawer
      const { useCartStore: store } = await import('@/stores/cartStore');
      await store.getState().refresh();
      openCart();
      router.push('/');
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div>
        {/* Progress dots */}
        <ol className="flex items-center gap-3 mb-8 text-xs">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-medium ${
                  n === step
                    ? 'bg-ink text-white'
                    : n < step
                      ? 'bg-sageDeep text-white'
                      : 'bg-offwhite border border-border text-ink/40'
                }`}
              >
                {n < step ? '✓' : n}
              </span>
              <span className={n === step ? 'font-medium' : 'text-ink/40'}>
                {n === 1 ? 'Цэцэг' : n === 2 ? 'Боолт' : 'AI үүсгэх'}
              </span>
              {n < 3 && <span className="text-ink/20">—</span>}
            </li>
          ))}
        </ol>

        {step === 1 && (
          <StepFlowers
            flowers={flowers}
            selections={selections}
            onChange={setSelections}
          />
        )}
        {step === 2 && (
          <StepWrap wraps={wraps} selected={wrapKey} onChange={setWrapKey} />
        )}
        {step === 3 && (
          <StepGenerate
            flowersByKey={flowersByKey}
            wrapsByKey={wrapsByKey}
            selections={selections}
            wrapKey={wrapKey}
            selectedVariant={variant?.key ?? null}
            onSelectVariant={setVariant}
          />
        )}

        {error && (
          <div className="mt-6 text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={isPending}
              className="btn-ghost"
            >
              ← Буцах
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              onClick={next}
              disabled={isPending || (step === 1 ? !canGoStep2 : !canGoStep3)}
              className="btn-primary ml-auto"
            >
              Дараах →
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={finish}
              disabled={isPending || !canFinish}
              className="btn-primary ml-auto"
            >
              {isPending ? 'Сагсанд нэмж байна…' : 'Сагсанд нэмэх →'}
            </button>
          )}
        </div>
      </div>

      {/* Summary sidebar */}
      <aside className="bg-white border border-border rounded-card p-5 h-fit sticky top-24">
        <h3 className="font-medium mb-4">Хураангуй</h3>

        {selections.length === 0 ? (
          <p className="text-sm text-ink/50 mb-4">
            Цэцгээ сонгож эхлэнэ үү
          </p>
        ) : (
          <ul className="space-y-1.5 mb-4 text-sm">
            {selections.map((s) => {
              const f = flowersByKey[s.key];
              if (!f) return null;
              return (
                <li
                  key={s.key}
                  className="flex justify-between text-ink/70"
                >
                  <span>
                    {f.emoji} {f.name} × {s.qty}
                  </span>
                  <span>{(f.price * s.qty).toLocaleString()}₮</span>
                </li>
              );
            })}
          </ul>
        )}

        {wrapKey && wrapsByKey[wrapKey] && (
          <div className="text-sm text-ink/70 flex justify-between mb-3 pb-3 border-b border-border">
            <span>
              {wrapsByKey[wrapKey].emoji} {wrapsByKey[wrapKey].name}
            </span>
            <span>+{pricing.wrap.toLocaleString()}₮</span>
          </div>
        )}

        {pricing.total > 0 && (
          <>
            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Материал</span>
                <span>{pricing.subtotal.toLocaleString()}₮</span>
              </div>
              {pricing.wrap > 0 && (
                <div className="flex justify-between text-ink/60">
                  <span>Боолт</span>
                  <span>{pricing.wrap.toLocaleString()}₮</span>
                </div>
              )}
              <div className="flex justify-between text-ink/60">
                <span>Atelier ажил</span>
                <span>{pricing.markup.toLocaleString()}₮</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Нийт</span>
                <span>{pricing.total.toLocaleString()}₮</span>
              </div>
            </div>
            <div className="text-xs text-ink/40">
              {stems} ширхэг цэцэг
            </div>
          </>
        )}

        {step === 3 && (
          <div className="mt-5 pt-5 border-t border-border">
            <label className="block text-[11px] uppercase tracking-wider text-ink/40 mb-1.5">
              Захиалгын нэр (заавал биш)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={60}
              placeholder="Жишээ нь: Ээжийн төрсөн өдөр"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
            />
          </div>
        )}
      </aside>
    </div>
  );
}
