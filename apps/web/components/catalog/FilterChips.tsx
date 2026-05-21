'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { CategoryConfig, FilterDef } from '@/lib/catalog';

export function FilterChips({
  config,
  activeFilter,
  counts,
}: {
  config: CategoryConfig;
  activeFilter: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setFilter(key: string) {
    const sp = new URLSearchParams(params);
    if (key === 'all') sp.delete('filter');
    else sp.set('filter', key);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="bg-white border-b border-border sticky top-[52px] z-20">
      <div className="max-w-container mx-auto px-6 flex items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {config.filters.map((f, i) => {
          if (f === '__div__') {
            return (
              <span
                key={`div-${i}`}
                className="w-px h-5 bg-border flex-shrink-0 mx-1"
              />
            );
          }
          const isActive = activeFilter === f.key;
          const count = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-3 text-[13px] whitespace-nowrap -mb-px border-b-2 transition-colors ${
                isActive
                  ? 'border-ink text-ink font-semibold'
                  : 'border-transparent text-ink/60 hover:text-ink hover:border-border'
              }`}
            >
              {f.label}
              <span
                className={`text-[11px] font-normal ${
                  isActive ? 'text-ink/60' : 'text-ink/40'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
