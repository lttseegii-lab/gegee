'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  useCartStore,
  calcSubtotal,
  calcDelivery,
  FREE_DELIVERY_THRESHOLD,
} from '@/stores/cartStore';
import { createClient } from '@/lib/supabase/client';
import { productImageUrl } from '@/lib/ai/pollinations';
import type { Product } from '@/types/database';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  const [products, setProducts] = useState<Map<string, Product>>(new Map());

  // Fetch product details whenever cart items change
  useEffect(() => {
    if (items.length === 0) {
      setProducts(new Map());
      return;
    }
    const supabase = createClient();
    const ids = items.map((i) => i.productId);
    supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .then(({ data }) => {
        const map = new Map<string, Product>();
        (data ?? []).forEach((p) => map.set(p.id, p));
        setProducts(map);
      });
  }, [items]);

  const subtotal = calcSubtotal(items, products);
  const delivery = calcDelivery(subtotal);
  const total = subtotal + delivery;
  const remainingToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col transition-transform duration-300 shadow-soft ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Сагс"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-serif italic text-2xl">Сагс</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Хаах"
            className="w-9 h-9 rounded-full hover:bg-offwhite flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="text-5xl mb-4">🌸</div>
              <p className="text-ink/60 mb-6">Танай сагс хоосон байна</p>
              <Link href="/catalog/all" onClick={close} className="btn-primary">
                Цэцэг үзэх →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const p = products.get(item.productId);
                if (!p) {
                  return (
                    <li key={item.productId} className="p-4 text-ink/40 text-sm">
                      Loading…
                    </li>
                  );
                }
                return (
                  <li key={item.productId} className="p-4 flex gap-3">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded bg-lilac/40 overflow-hidden">
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
                      <h4 className="font-medium text-sm truncate">{p.name}</h4>
                      <div className="text-xs text-ink/60 mt-0.5">
                        {p.price.toLocaleString()}₮
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center border border-border rounded">
                          <button
                            type="button"
                            onClick={() => setQty(p.id, item.qty - 1)}
                            className="w-7 h-7 hover:bg-offwhite"
                            aria-label="Багасгах"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-sm">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(p.id, item.qty + 1)}
                            disabled={item.qty >= 20}
                            className="w-7 h-7 hover:bg-offwhite disabled:opacity-30"
                            aria-label="Нэмэх"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="text-xs text-ink/40 hover:text-pinkHot"
                        >
                          Хасах
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold whitespace-nowrap">
                      {(p.price * item.qty).toLocaleString()}₮
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border p-6 flex-shrink-0 bg-offwhite">
            {remainingToFree > 0 ? (
              <>
                <div className="text-xs text-ink/70 mb-1.5">
                  Үнэгүй хүргэлт хүртэл{' '}
                  <strong className="text-sageDeep">
                    {remainingToFree.toLocaleString()}₮
                  </strong>{' '}
                  үлдсэн
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-sageDeep transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-xs text-sageDeep mb-4">
                🎉 <strong>Үнэгүй хүргэлт</strong> идэвхэжсэн
              </div>
            )}

            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span>Дэд дүн</span>
                <span>{subtotal.toLocaleString()}₮</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Хүргэлт</span>
                <span>
                  {delivery === 0 ? (
                    <span className="text-sageDeep font-medium">Үнэгүй</span>
                  ) : (
                    `${delivery.toLocaleString()}₮`
                  )}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Нийт</span>
                <span>{total.toLocaleString()}₮</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={close}
              className="btn-primary w-full"
            >
              Захиалах →
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
