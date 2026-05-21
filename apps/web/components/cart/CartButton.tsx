'use client';

import { useCartCount, useCartStore } from '@/stores/cartStore';

export function CartButton() {
  const count = useCartCount();
  const open = useCartStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-1.5 relative hover:text-pinkHot transition-colors"
      aria-label={`Сагс — ${count} бүтээгдэхүүн`}
    >
      🛒 <span className="text-xs">Сагс</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pinkHot text-white text-[10px] font-semibold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
