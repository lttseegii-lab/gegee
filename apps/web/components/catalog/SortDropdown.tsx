'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS, type SortKey } from '@/lib/catalog';

export function SortDropdown({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setSort(next: string) {
    const sp = new URLSearchParams(params);
    if (next === 'popular') sp.delete('sort');
    else sp.set('sort', next);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <span className="text-[13px] text-ink/60">Эрэмбэлэх</span>
      <select
        value={value}
        onChange={(e) => setSort(e.target.value)}
        className="border border-border rounded-lg pl-3 pr-8 py-2 text-[13px] bg-white cursor-pointer hover:border-ink transition-colors appearance-none bg-no-repeat bg-[length:12px] bg-[right_10px_center]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
