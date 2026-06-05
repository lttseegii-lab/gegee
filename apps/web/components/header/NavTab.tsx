'use client';

import Link from 'next/link';
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MegaMenu } from './MegaMenu';
import type { MegaTab } from './megaMenuConfig';

/**
 * Wraps a single nav tab + its mega menu in a client component so that:
 * - Click on any link inside the mega menu immediately collapses the panel
 *   (without waiting for hover to leave).
 * - Mouse-leave re-arms the hover behaviour for the next open.
 *
 * Background color comes from `tab.bgHex` (resolved server-side from admin
 * config — supports any hex color). We set it as a CSS variable on the <li>
 * and reference it via Tailwind arbitrary-value group-hover. Fall back to
 * the legacy `tab.tabHoverClass` if no hex is provided.
 */
export function NavTab({ tab }: { tab: MegaTab }) {
  const [closedAfterClick, setClosedAfterClick] = useState(false);
  const pathname = usePathname();
  const liRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    setClosedAfterClick(false);
  }, [pathname]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      setClosedAfterClick(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setClosedAfterClick(false);
  }, []);

  // CSS var lets the inner <Link> reference the hex without re-render on hover.
  const style = tab.bgHex
    ? ({ ['--tab-hover' as string]: tab.bgHex } as React.CSSProperties)
    : undefined;

  // When bgHex is set, use arbitrary-value group-hover; otherwise legacy class.
  const hoverClass = tab.bgHex
    ? 'group-hover:bg-[var(--tab-hover)]'
    : (tab.tabHoverClass ?? '');

  return (
    <li
      ref={liRef}
      className="relative group"
      data-closed={closedAfterClick ? 'true' : undefined}
      onClickCapture={handleClick}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <Link
        href={tab.href}
        className={`flex items-center gap-2 py-4 px-3 rounded-t-lg transition-colors relative z-10 hover:text-ink ${hoverClass} ${tab.hasMega ? 'group-hover:font-semibold group-data-[closed=true]:font-normal' : 'hover:text-pinkHot'}`}
      >
        {tab.label}
        {tab.badge && (
          <span className="badge-yellow">
            {tab.badge === 'new' ? 'шинэ' : 'top'}
          </span>
        )}
      </Link>
      {tab.hasMega && <MegaMenu tab={tab} />}
    </li>
  );
}
