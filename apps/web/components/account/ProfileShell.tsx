'use client';

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

  const initial = (name || email || '?').charAt(0).toUpperCase();

  return (
    <div className="h-screen bg-ink/5 p-4 sm:p-6 flex">
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
          <aside className="border-r border-border flex flex-col min-h-0">
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
                const isActive =
                  pathname === it.href ||
                  pathname.startsWith(it.href + '/') ||
                  (it.match?.some(
                    (m) => pathname === m || pathname.startsWith(m + '/')
                  ) ?? false);
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

            <form
              action={signOut}
              className="p-4 border-t border-border flex-shrink-0 bg-white"
            >
              <button
                type="submit"
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
            </form>
          </aside>

          <div className="p-8 sm:p-10 overflow-y-auto min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
