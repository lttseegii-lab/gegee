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
 * Implementation: track a `closedAfterClick` flag and toggle a `data-closed`
 * attribute on the <li>. CSS overrides group-hover when that attr is set.
 */
export function NavTab({ tab }: { tab: MegaTab }) {
  const [closedAfterClick, setClosedAfterClick] = useState(false);
  const pathname = usePathname();
  const liRef = useRef<HTMLLIElement | null>(null);

  // When the route changes (after navigation completes), reset.
  useEffect(() => {
    setClosedAfterClick(false);
  }, [pathname]);

  // Any click inside this <li> that lands on an <a> closes the menu.
  const handleClick = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('a')) {
      setClosedAfterClick(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Re-arm hover after pointer leaves
    setClosedAfterClick(false);
  }, []);

  return (
    <li
      ref={liRef}
      className="relative group"
      data-closed={closedAfterClick ? 'true' : undefined}
      onClickCapture={handleClick}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={tab.href}
        className={`flex items-center gap-2 py-4 px-3 rounded-t-lg transition-colors relative z-10 hover:text-ink ${tab.tabHoverClass ?? ''} ${tab.hasMega ? 'group-hover:font-semibold group-data-[closed=true]:font-normal' : 'hover:text-pinkHot'}`}
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
