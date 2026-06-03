'use client';

import Image from 'next/image';
import { useEffect, useState, useTransition } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { productImageUrl } from '@/lib/ai/pollinations';
import type { Product } from '@/types/database';

type CartProduct = Pick<Product, 'id' | 'name' | 'price' | 'img_url' | 'img_seed' | 'img_prompt'>;

export function UpsellList({
  products,
  emptyHint,
}: {
  products: CartProduct[];
  emptyHint: string;
}) {
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (products.length === 0) {
    return (
      <div className="bg-offwhite rounded-card p-10 text-center text-sm text-ink/50">
        {emptyHint}
      </div>
    );
  }

  function qtyOf(productId: string) {
    return items.find((i) => i.productId === productId)?.qty ?? 0;
  }

  function onAdd(productId: string) {
    setBusyId(productId);
    startTransition(async () => {
      await add(productId, 1);
      setBusyId(null);
    });
  }

  function onInc(productId: string) {
    const next = qtyOf(productId) + 1;
    setBusyId(productId);
    startTransition(async () => {
      await setQty(productId, next);
      setBusyId(null);
    });
  }

  function onDec(productId: string) {
    const cur = qtyOf(productId);
    if (cur <= 0) return;
    setBusyId(productId);
    startTransition(async () => {
      if (cur === 1) await remove(productId);
      else await setQty(productId, cur - 1);
      setBusyId(null);
    });
  }

  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {products.map((p) => {
        const qty = qtyOf(p.id);
        const isBusy = busyId === p.id;
        return (
          <li
            key={p.id}
            className="bg-white border border-border rounded-card p-3 flex gap-3 items-start"
          >
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg bg-lilac/40 overflow-hidden">
              <Image
                src={productImageUrl(p, 160, 160)}
                alt={p.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-serif text-sm leading-snug line-clamp-2">
                {p.name}
              </h4>
              <div className="text-xs text-ink/60 mt-0.5">
                {p.price.toLocaleString()}₮
              </div>
              <div className="mt-2">
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => onAdd(p.id)}
                    disabled={isBusy}
                    className="text-xs px-3 py-1.5 rounded-full bg-ink text-white hover:bg-pinkHot transition-colors disabled:opacity-50"
                  >
                    + Нэмэх
                  </button>
                ) : (
                  <div className="inline-flex items-center border border-border rounded-full bg-offwhite">
                    <button
                      type="button"
                      onClick={() => onDec(p.id)}
                      disabled={isBusy}
                      className="w-7 h-7 rounded-l-full hover:bg-white text-sm"
                      aria-label="Багасгах"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-xs font-medium">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInc(p.id)}
                      disabled={isBusy || qty >= 20}
                      className="w-7 h-7 rounded-r-full hover:bg-white disabled:opacity-30 text-sm"
                      aria-label="Нэмэх"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
