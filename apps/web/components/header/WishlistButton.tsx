'use client';

import { useWishlistCount, useWishlistStore } from '@/stores/wishlistStore';

export function WishlistButton() {
  const count = useWishlistCount();
  const open = useWishlistStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={open}
      className="relative inline-flex items-center justify-center p-2 -m-2 text-ink hover:text-pinkHot transition-colors"
      aria-label={`Хадгалсан — ${count} бүтээгдэхүүн`}
      title="Хадгалсан"
    >
      <span className="relative inline-flex">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={count > 0 ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
