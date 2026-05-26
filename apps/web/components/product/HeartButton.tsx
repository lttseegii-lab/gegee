'use client';

import { useWishlistStore } from '@/stores/wishlistStore';

export function HeartButton({
  productId,
  size = 'md',
}: {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const inList = useWishlistStore((s) => s.productIds.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-9 h-9 text-lg',
    lg: 'w-12 h-12 text-xl',
  }[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label={inList ? 'Хадгалснаас хасах' : 'Хадгалах'}
      aria-pressed={inList}
      className={`${sizeClasses} rounded-full flex items-center justify-center transition-all bg-white/90 backdrop-blur hover:bg-white border border-border ${
        inList ? 'text-pinkHot' : 'text-ink/40 hover:text-ink'
      }`}
    >
      {inList ? '♥' : '♡'}
    </button>
  );
}
