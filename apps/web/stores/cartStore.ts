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
  /** Hydrated product details keyed by productId — populated by refresh() */
  products: Record<string, Product>;
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
  /** Re-fetch items + products from server. */
  refresh: () => Promise<void>;
  /** Re-fetch only product details (uses current items). */
  refreshProducts: () => Promise<void>;
  /** Merge localStorage cart into server (on login). */
  mergeToServer: () => Promise<void>;
  /** Hydrate from server on app start. */
  hydrate: () => Promise<void>;
}

const supabase = createClient();

async function currentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    // A broken/expired refresh token must not crash cart hydration —
    // treat it as anonymous and fall back to the localStorage cart.
    return null;
  }
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      products: {},
      isOpen: false,
      hydrated: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      add: async (productId, qty = 1) => {
        // Optimistic, immutable update (mirrors setQty) so rapid concurrent
        // clicks can't mutate shared state or lose an increment.
        const inc = Math.max(1, Math.floor(qty));
        const existing = get().items.find((i) => i.productId === productId);
        const items = existing
          ? get().items.map((i) =>
              i.productId === productId
                ? { ...i, qty: Math.min(20, i.qty + inc) }
                : i
            )
          : [...get().items, { productId, qty: Math.min(20, inc) }];
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
            return;
          }
        }
        // Guard against adding a product that has since been deactivated (a
        // stale Add button) — it would otherwise sit in the cart and be rejected
        // at checkout. Custom DIY products are intentionally inactive.
        const { data: prod } = await supabase
          .from('products')
          .select('active, tags')
          .eq('id', productId)
          .maybeSingle();
        const isCustomDiy = (prod?.tags ?? []).includes('custom-diy');
        if (prod && prod.active === false && !isCustomDiy) {
          await get().remove(productId);
          return;
        }
        // Make sure product details for the new item are loaded
        if (!get().products[productId]) {
          await get().refreshProducts();
        }
      },

      remove: async (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        const uid = await currentUserId();
        if (uid) {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', uid)
            .eq('product_id', productId);
          if (error) {
            console.error('Cart remove error', error);
            await get().refresh();
          }
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
          const { error } = await supabase
            .from('cart_items')
            .upsert({ user_id: uid, product_id: productId, qty: clamped });
          if (error) {
            console.error('Cart setQty error', error);
            await get().refresh();
          }
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
          // Anonymous: keep localStorage items, just hydrate product details
          await get().refreshProducts();
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
        // Fetch product details after items update
        await get().refreshProducts();
      },

      refreshProducts: async () => {
        const items = get().items;
        if (items.length === 0) {
          set({ products: {} });
          return;
        }
        const ids = items.map((i) => i.productId);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', ids);
        if (error) {
          console.error('Cart products fetch error:', error.message);
          return;
        }
        const map: Record<string, Product> = {};
        (data ?? []).forEach((p) => { map[p.id] = p; });
        // Prune cart lines whose product is no longer available (inactive/
        // deleted catalog items in a persisted guest cart) so they don't render
        // as eternal "Loading…" rows or skew the count. Owners can always read
        // their own cart products (incl. custom DIY) via RLS, so nothing
        // legitimate is dropped.
        const missing = items.filter((i) => !map[i.productId]);
        // Only self-heal when the fetch actually returned at least one product.
        // An empty result (transient error / broken session) must NOT wipe a
        // valid cart — leave the items and let the drawer offer a remove button.
        if (missing.length > 0 && (data?.length ?? 0) > 0) {
          set({ items: items.filter((i) => map[i.productId]), products: map });
          const uid = await currentUserId();
          if (uid) {
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', uid)
              .in('product_id', missing.map((i) => i.productId));
          }
        } else {
          set({ products: map });
        }
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

// Re-exported from the plain (non-'use client') module so client components
// that import these from the cart store keep working. Server code must import
// from '@/lib/delivery' directly (see lib/delivery.ts for why).
export {
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
  calcDelivery,
} from '@/lib/delivery';
