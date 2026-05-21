'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Захиалга', icon: '📦' },
  { href: '/admin/products', label: 'Бүтээгдэхүүн', icon: '🌸' },
  { href: '/admin/customers', label: 'Хэрэглэгч', icon: '👥' },
  { href: '/admin/capacity', label: 'Capacity', icon: '📅' },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-border flex-shrink-0 min-h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <Link href="/" className="font-serif italic text-xl">
          Gegeen <span className="text-pinkHot">✻</span>
        </Link>
        <div className="text-[11px] uppercase tracking-wider text-ink/40 mt-1">
          Backoffice
        </div>
      </div>

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border text-xs text-ink/60">
        <div className="font-medium text-ink/80 truncate">{adminName}</div>
        <div className="mt-0.5">Admin role</div>
        <Link href="/" className="text-pinkHot hover:underline mt-2 inline-block">
          ← Нүүр хуудас
        </Link>
      </div>
    </aside>
  );
}
