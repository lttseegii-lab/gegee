'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { MegaTab } from './megaMenuConfig';

/**
 * Mobile navigation — a hamburger button + slide-in drawer shown only below the
 * `md` breakpoint (the desktop mega-menu nav is `hidden md:block`). Sub-category
 * links live in per-tab accordions since the hover mega-menu is unreachable on
 * touch. No business logic — purely the mobile presentation of the same tabs.
 */
export function MobileNav({ tabs }: { tabs: MegaTab[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  // Close the drawer on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center w-11 h-11 -ml-2 text-ink hover:text-pinkHot transition-colors"
        aria-label="Цэс нээх"
        aria-expanded={open}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <span className="font-serif italic text-xl">Цэс</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Хаах"
                className="w-11 h-11 -mr-2 inline-flex items-center justify-center text-ink/50 hover:text-ink text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <ul className="divide-y divide-border">
                {tabs.map((tab) => {
                  const subs = [...(tab.col1 ?? []), ...(tab.col2 ?? [])];
                  const hasSub = tab.hasMega && subs.length > 0;

                  if (!hasSub) {
                    return (
                      <li key={tab.label}>
                        <Link
                          href={tab.href}
                          className="flex items-center gap-2 px-5 py-4 min-h-[44px] text-[15px]"
                        >
                          {tab.label}
                          {tab.badge && (
                            <span className="badge-yellow">
                              {tab.badge === 'new' ? 'шинэ' : 'top'}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  }

                  const isExpanded = expanded === tab.label;
                  return (
                    <li key={tab.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(isExpanded ? null : tab.label)
                        }
                        className="w-full flex items-center justify-between gap-2 px-5 py-4 min-h-[44px] text-[15px]"
                        aria-expanded={isExpanded}
                      >
                        <span className="flex items-center gap-2">
                          {tab.label}
                          {tab.badge && (
                            <span className="badge-yellow">
                              {tab.badge === 'new' ? 'шинэ' : 'top'}
                            </span>
                          )}
                        </span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-ink/40 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <ul className="pb-2 bg-offwhite/60">
                          <li>
                            <Link
                              href={tab.href}
                              className="block px-8 py-3 min-h-[44px] text-sm text-ink/70"
                            >
                              Бүгд →
                            </Link>
                          </li>
                          {subs.map((l) => (
                            <li key={l.label + l.href}>
                              <Link
                                href={l.href}
                                className="flex items-center gap-2 px-8 py-3 min-h-[44px] text-sm text-ink/70"
                              >
                                {l.label}
                                {l.badge && (
                                  <span className="badge-yellow">
                                    {l.badge === 'new' ? 'шинэ' : 'top'}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
