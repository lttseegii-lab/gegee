'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { productImageUrl } from '@/lib/ai/pollinations';

export function WishlistDrawer() {
  const isOpen = useWishlistStore((s) => s.isOpen);
  const close = useWishlistStore((s) => s.close);
  const productIds = useWishlistStore((s) => s.productIds);
  const productsRecord = useWishlistStore((s) => s.products);
  const remove = useWishlistStore((s) => s.remove);
  const refreshProducts = useWishlistStore((s) => s.refreshProducts);

  const addToCart = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.open);

  // Preserve insertion order from productIds
  const items = productIds
    .map((id) => productsRecord[id])
    .filter((p): p is NonNullable<typeof p> => p != null);

  // If drawer opens with productIds but missing product details, fetch them.
  useEffect(() => {
    if (!isOpen || productIds.length === 0) return;
    const missing = productIds.some((id) => !productsRecord[id]);
    if (missing) {
      refreshProducts();
    }
  }, [isOpen, productIds, productsRecord, refreshProducts]);

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

  async function onAddToCart(productId: string) {
    await addToCart(productId, 1);
    close();
    openCart();
  }

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
        aria-label="Хадгалсан бүтээгдэхүүн"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif italic text-2xl">Хадгалсан</h2>
            {items.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-ink/5 text-xs text-ink/70 font-medium">
                {items.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Хаах"
            className="w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="text-5xl mb-4">♡</div>
              <p className="text-ink/60 mb-6">
                Та одоохондоо юу ч хадгалаагүй байна
              </p>
              <Link
                href="/catalog/all"
                onClick={close}
                className="btn-primary"
              >
                Цэцэг үзэх →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((p) => (
                <li key={p.id} className="px-6 py-5 flex gap-4 items-start">
                  <Link
                    href={`/product/${p.id}`}
                    onClick={close}
                    className="relative w-24 h-24 flex-shrink-0 rounded-lg bg-lilac/40 overflow-hidden"
                  >
                    <Image
                      src={productImageUrl(p, 200, 200)}
                      alt={p.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${p.id}`}
                      onClick={close}
                      className="block font-serif text-lg leading-snug text-ink hover:text-pinkHot transition-colors"
                    >
                      {p.name}
                    </Link>
                    <div className="text-sm text-ink/80 mt-0.5 mb-3">
                      {p.price.toLocaleString()}₮
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddToCart(p.id)}
                      className="btn-primary text-xs py-2 px-4"
                    >
                      + Сагсанд нэмэх
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label="Хадгалснаас хасах"
                    className="w-8 h-8 rounded-full hover:bg-offwhite flex items-center justify-center text-ink/40 hover:text-pinkHot shrink-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
