'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Захиалга', icon: '📦' },
  { href: '/admin/products', label: 'Бүтээгдэхүүн', icon: '🌸' },
  { href: '/admin/diy', label: 'DIY', icon: '✂️' },
  { href: '/admin/customers', label: 'Хэрэглэгч', icon: '👥' },
  { href: '/admin/rewards', label: 'Rewards', icon: '🌟' },
  { href: '/admin/capacity', label: 'Capacity', icon: '📅' },
  { href: '/admin/theme', label: 'Theme', icon: '🎨' },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation + lock body scroll while open.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const nav = (
    <nav className="p-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-ink text-white font-medium'
                : 'text-ink hover:bg-offwhite'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="p-4 border-t border-border text-xs text-ink/60">
      <div className="font-medium text-ink/80 truncate">{adminName}</div>
      <div className="mt-0.5">Admin role</div>
      <Link href="/" className="text-pinkHot hover:underline mt-2 inline-block">
        ← Нүүр хуудас
      </Link>
    </div>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-white border-b border-border">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Цэс нээх"
          aria-expanded={open}
          className="inline-flex items-center justify-center w-11 h-11 -ml-2 text-ink"
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
        <Link href="/admin" className="font-serif italic text-lg">
          Thanks <span className="text-pinkHot">✻</span>
        </Link>
        <span className="text-[10px] uppercase tracking-wider text-ink/40">
          Backoffice
        </span>
      </div>

      {/* Mobile off-canvas drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[85%] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
              <Link href="/admin" className="font-serif italic text-lg">
                Thanks <span className="text-pinkHot">✻</span>
              </Link>
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
              {nav}
            </div>
            {footer}
          </aside>
        </div>
      )}

      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-border flex-shrink-0 min-h-screen sticky top-0">
        <div className="p-5 border-b border-border">
          <Link href="/" className="font-serif italic text-xl">
            Thanks <span className="text-pinkHot">✻</span>
          </Link>
          <div className="text-[11px] uppercase tracking-wider text-ink/40 mt-1">
            Backoffice
          </div>
        </div>
        <div className="flex-1">{nav}</div>
        {footer}
      </aside>
    </>
  );
}
