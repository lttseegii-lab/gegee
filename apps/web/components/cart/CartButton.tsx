'use client';

import { useCartCount, useCartStore } from '@/stores/cartStore';

export function CartButton() {
  const count = useCartCount();
  const open = useCartStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={open}
      className="relative inline-flex items-center justify-center p-2 -m-2 text-ink hover:text-pinkHot transition-colors"
      aria-label={`Сагс — ${count} бүтээгдэхүүн`}
      title="Сагс"
    >
      <span className="relative inline-flex">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pinkHot text-white text-[10px] font-semibold flex items-center justify-center">
            {count}
          </span>
        )}
      </span>
    </button>
  );
}
