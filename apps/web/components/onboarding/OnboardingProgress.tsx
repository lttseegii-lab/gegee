export type OnboardingStep = 'welcome' | 'mood' | 'memory' | 'done';

export const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'welcome', label: 'Тавтай морил' },
  { key: 'mood',    label: 'Цэцэг' },
  { key: 'memory',  label: 'Чухал огноо' },
  { key: 'done',    label: 'Бэлэн' },
];

export function OnboardingProgress({ current }: { current: OnboardingStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                active
                  ? 'bg-ink w-6'
                  : done
                    ? 'bg-pinkHot'
                    : 'bg-ink/15'
              }`}
              aria-label={s.label}
              aria-current={active ? 'step' : undefined}
            />
          </li>
        );
      })}
    </ol>
  );
}

export function parseStep(raw: string | string[] | undefined): OnboardingStep {
  if (typeof raw !== 'string') return 'welcome';
  if (raw === 'mood' || raw === 'memory' || raw === 'done') return raw;
  return 'welcome';
}
