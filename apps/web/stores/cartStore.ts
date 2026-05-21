'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

export interface CartItem {
  productId: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // Hydration flag — true once we've synced with the server (or confirmed no user)
  hydrated: boolean;
}

interface CartActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Add to cart (or increment qty). Optimistic — UI updates first, server sync on next tick. */
  add: (productId: string, qty?: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  clear: () => Promise<void>;
  /** Re-fetch from server. No-op for guests. */
  refresh: () => Promise<void>;
  /** Merge localStorage cart into server (on login). */
  mergeToServer: () => Promise<void>;
  /** Hydrate from server on app start. */
  hydrate: () => Promise<void>;
}

const supabase = createClient();

async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      hydrated: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      add: async (productId, qty = 1) => {
        // Optimistic
        const items = [...get().items];
        const existing = items.find((i) => i.productId === productId);
        if (existing) {
          existing.qty = Math.min(20, existing.qty + qty);
        } else {
          items.push({ productId, qty: Math.min(20, qty) });
        }
        set({ items });

        // Persist if logged in
        const uid = await currentUserId();
        if (uid) {
          const newQty = items.find((i) => i.productId === productId)!.qty;
          const { error } = await supabase
            .from('cart_items')
            .upsert({ user_id: uid, product_id: productId, qty: newQty });
          if (error) {
            console.error('Cart add error', error);
            await get().refresh();
          }
        }
      },

      remove: async (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        const uid = await currentUserId();
        if (uid) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', uid)
            .eq('product_id', productId);
        }
      },

      setQty: async (productId, qty) => {
        const clamped = Math.max(0, Math.min(20, qty));
        if (clamped === 0) return get().remove(productId);

        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty: clamped } : i
          ),
        });

        const uid = await currentUserId();
        if (uid) {
          await supabase
            .from('cart_items')
            .upsert({ user_id: uid, product_id: productId, qty: clamped });
        }
      },

      clear: async () => {
        set({ items: [] });
        const uid = await currentUserId();
        if (uid) {
          await supabase.from('cart_items').delete().eq('user_id', uid);
        }
      },

      refresh: async () => {
        const uid = await currentUserId();
        if (!uid) {
          set({ hydrated: true });
          return;
        }
        const { data } = await supabase
          .from('cart_items')
          .select('product_id, qty')
          .eq('user_id', uid);
        set({
          items: (data ?? []).map((r) => ({ productId: r.product_id, qty: r.qty })),
          hydrated: true,
        });
      },

      mergeToServer: async () => {
        const uid = await currentUserId();
        if (!uid) return;
        const items = get().items;
        if (items.length === 0) return get().refresh();

        const { error } = await supabase.rpc('merge_guest_cart', {
          items: items.map((i) => ({ id: i.productId, qty: i.qty })),
        });
        if (error) console.error('Cart merge error', error);

        await get().refresh();
      },

      hydrate: async () => {
        await get().refresh();
      },
    }),
    {
      name: 'gegeen_cart_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ─── Selectors ───
export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

export const useCartItems = () => useCartStore((s) => s.items);

export function calcSubtotal(
  items: CartItem[],
  products: Map<string, Pick<Product, 'price'>>
): number {
  return items.reduce((sum, i) => {
    const p = products.get(i.productId);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

export const FREE_DELIVERY_THRESHOLD = 100_000;
export const DELIVERY_FEE = 8_000;

export function calcDelivery(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
