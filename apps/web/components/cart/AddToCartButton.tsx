'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';

export function AddToCartButton({
  productId,
  variant = 'icon',
}: {
  productId: string;
  variant?: 'icon' | 'full';
}) {
  const add = useCartStore((s) => s.add);
  const open = useCartStore((s) => s.open);
  const [pending, setPending] = useState(false);

  async function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    await add(productId, 1);
    setPending(false);
    open();
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        aria-label="Сагсанд нэмэх"
        className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center hover:bg-pinkHot transition-colors disabled:opacity-50"
      >
        {pending ? '…' : '+'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-primary flex-1 disabled:opacity-50"
    >
      {pending ? 'Нэмж байна…' : 'Сагсанд нэмэх'}
    </button>
  );
}
