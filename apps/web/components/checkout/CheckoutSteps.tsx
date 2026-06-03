import Link from 'next/link';

export type CheckoutStep = 'cart' | 'gifts' | 'card' | 'pay';

export const STEPS: { key: CheckoutStep; label: string; icon: string }[] = [
  { key: 'cart',  label: 'Сагс',   icon: '🛒' },
  { key: 'gifts', label: 'Бэлэг',  icon: '🎁' },
  { key: 'card',  label: 'Card',   icon: '💌' },
  { key: 'pay',   label: 'Төлбөр', icon: '💳' },
];

export function CheckoutStepIndicator({
  current,
}: {
  current: CheckoutStep;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-2 sm:gap-3 mb-8">
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const reachable = idx <= currentIdx;
        const inner = (
          <>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                active
                  ? 'bg-ink text-white'
                  : done
                    ? 'bg-mint text-sageDeep'
                    : 'bg-ink/5 text-ink/40'
              }`}
            >
              {done ? '✓' : idx + 1}
            </span>
            <span
              className={`text-sm font-medium ${
                active
                  ? 'text-ink'
                  : done
                    ? 'text-ink/70'
                    : 'text-ink/40'
              }`}
            >
              {s.label}
            </span>
          </>
        );
        return (
          <li key={s.key} className="flex items-center gap-2 sm:gap-3">
            {reachable ? (
              <Link
                href={`/checkout?step=${s.key}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-2">{inner}</div>
            )}
            {idx < STEPS.length - 1 && (
              <span
                className={`w-6 sm:w-10 h-px ${
                  done ? 'bg-sageDeep/40' : 'bg-ink/10'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function parseStep(raw: string | string[] | undefined): CheckoutStep {
  if (typeof raw !== 'string') return 'cart';
  if (raw === 'gifts' || raw === 'card' || raw === 'pay') return raw;
  return 'cart';
}

export function nextStep(current: CheckoutStep): CheckoutStep | null {
  const idx = STEPS.findIndex((s) => s.key === current);
  return STEPS[idx + 1]?.key ?? null;
}

export function prevStep(current: CheckoutStep): CheckoutStep | null {
  const idx = STEPS.findIndex((s) => s.key === current);
  return STEPS[idx - 1]?.key ?? null;
}
