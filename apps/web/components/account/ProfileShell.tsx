'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/(shop)/auth/actions';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Match these prefixes too (so sub-routes still highlight the parent). */
  match?: string[];
};

const ITEMS: NavItem[] = [
  { href: '/account/profile', label: 'Профайл', icon: '👤' },
  { href: '/account/memory-garden', label: 'Мартаж болохгүй өдрүүд', icon: '🌷' },
  { href: '/account/rewards', label: 'Урамшууллын оноо', icon: '🎁' },
  { href: '/account/orders', label: 'Захиалга', icon: '🔁' },
];

export function ProfileShell({
  name,
  email,
  flowerImageUrl,
  flowerLabel,
  children,
}: {
  name: string;
  email: string;
  /** Resolved (admin-overridden) profile flower URL — null if not set */
  flowerImageUrl?: string | null;
  flowerLabel?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [confirmOut, setConfirmOut] = useState(false);

  // Close the sign-out confirmation on Escape and lock body scroll while open.
  useEffect(() => {
    if (!confirmOut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOut(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmOut]);

  const initial = (name || email || '?').charAt(0).toUpperCase();

  const isItemActive = (it: NavItem) =>
    pathname === it.href ||
    pathname.startsWith(it.href + '/') ||
    (it.match?.some((m) => pathname === m || pathname.startsWith(m + '/')) ??
      false);

  return (
    <div className="min-h-screen lg:h-screen bg-ink/5 p-3 sm:p-6 flex">
      <div className="max-w-container w-full mx-auto bg-white rounded-[24px] shadow-soft overflow-hidden relative flex flex-col flex-1">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Хаах"
          className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink/70 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="grid lg:grid-cols-[280px_1fr] flex-1 min-h-0">
          {/* Mobile: compact profile header + horizontal nav (sidebar is lg-only) */}
          <div className="lg:hidden border-b border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              {flowerImageUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border bg-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flowerImageUrl}
                    alt={flowerLabel ?? 'avatar'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-peach to-pinkHot flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-sm">{name}</div>
                <div className="text-xs text-ink/50 truncate">{email}</div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOut(true)}
                className="text-sm text-pinkHot shrink-0 px-2 min-h-[44px]"
              >
                Гарах
              </button>
            </div>
            <nav className="flex gap-2 overflow-x-auto px-3 pb-3">
              {ITEMS.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-full text-sm font-medium ${
                    isItemActive(it)
                      ? 'bg-ink text-white'
                      : 'bg-ink/5 text-ink/80'
                  }`}
                >
                  <span>{it.icon}</span>
                  <span>{it.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <aside className="hidden lg:flex border-r border-border lg:flex-col min-h-0">
            <div className="p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                {flowerImageUrl ? (
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border bg-ink/5"
                    title={flowerLabel ?? undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={flowerImageUrl}
                      alt={flowerLabel ?? 'avatar'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-peach to-pinkHot flex items-center justify-center text-white font-semibold text-lg shrink-0">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{name}</div>
                  <div className="text-xs text-ink/50 truncate">{email}</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto min-h-0">
              {ITEMS.map((it) => {
                const isActive = isItemActive(it);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-ink/80 hover:bg-ink/5'
                    }`}
                  >
                    <span className="text-base">{it.icon}</span>
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setConfirmOut(true)}
                className="flex items-center gap-2 text-sm text-pinkHot hover:text-pinkHot/80 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Системээс гарах
              </button>
            </div>
          </aside>

          <div className="p-5 sm:p-10 overflow-y-auto min-h-0">{children}</div>
        </div>
      </div>

      {confirmOut && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-confirm-title"
          onClick={() => setConfirmOut(false)}
        >
          <div
            className="bg-white rounded-[20px] shadow-soft max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">👋</div>
            <h2 id="signout-confirm-title" className="font-serif text-xl mb-2">
              Та гарахдаа итгэлтэй байна уу?
            </h2>
            <p className="text-sm text-ink/60 mb-6">
              Гарсны дараа дахин нэвтрэх шаардлагатай болно.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOut(false)}
                className="btn-ghost flex-1"
              >
                Үгүй
              </button>
              <form action={signOut} className="flex-1">
                <ConfirmSignOutButton />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Submit button for the sign-out form. Shows a pending label and disables
 * itself while the server action runs so the user can't double-submit.
 */
function ConfirmSignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Гарч байна…' : 'Тийм'}
    </button>
  );
}
