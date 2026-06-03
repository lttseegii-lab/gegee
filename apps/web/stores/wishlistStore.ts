'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

interface WishlistState {
  productIds: string[];
  /** Hydrated product details keyed by id — populated by refreshProducts() */
  products: Record<string, Product>;
  isOpen: boolean;
  hydrated: boolean;
}

interface WishlistActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  refresh: () => Promise<void>;
  /** Fetch product detail rows for current productIds. */
  refreshProducts: () => Promise<void>;
  hydrate: () => Promise<void>;
  mergeToServer: () => Promise<void>;
  clear: () => Promise<void>;
}

const supabase = createClient();

async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchProducts(ids: string[]): Promise<Record<string, Product>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('active', true);
  const map: Record<string, Product> = {};
  for (const p of (data ?? []) as Product[]) {
    map[p.id] = p;
  }
  return map;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    (set, get) => ({
      productIds: [],
      products: {},
      isOpen: false,
      hydrated: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      has: (productId) => get().productIds.includes(productId),

      add: async (productId) => {
        if (get().productIds.includes(productId)) return;
        set({ productIds: [...get().productIds, productId] });

        const uid = await currentUserId();
        if (uid) {
          await supabase
            .from('wishlist_items')
            .insert({ user_id: uid, product_id: productId });
        }
        await get().refreshProducts();
      },

      remove: async (productId) => {
        set({ productIds: get().productIds.filter((id) => id !== productId) });

        const uid = await currentUserId();
        if (uid) {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', uid)
            .eq('product_id', productId);
        }
      },

      toggleItem: async (productId) => {
        const current = get().productIds;
        if (current.includes(productId)) {
          await get().remove(productId);
        } else {
          await get().add(productId);
        }
      },

      refresh: async () => {
        const uid = await currentUserId();
        if (!uid) {
          set({ hydrated: true });
          // Still hydrate product details from local productIds
          const products = await fetchProducts(get().productIds);
          set({ products });
          return;
        }
        const { data } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', uid);
        const productIds = (data ?? []).map((r) => r.product_id);
        const products = await fetchProducts(productIds);
        set({
          productIds,
          products,
          hydrated: true,
        });
      },

      refreshProducts: async () => {
        const ids = get().productIds;
        const products = await fetchProducts(ids);
        set({ products });
      },

      hydrate: async () => {
        await get().refresh();
      },

      mergeToServer: async () => {
        const uid = await currentUserId();
        if (!uid) return;
        const local = get().productIds;
        if (local.length === 0) {
          await get().refresh();
          return;
        }
        await supabase
          .from('wishlist_items')
          .upsert(
            local.map((product_id) => ({ user_id: uid, product_id })),
            { onConflict: 'user_id,product_id', ignoreDuplicates: true }
          );
        await get().refresh();
      },

      clear: async () => {
        set({ productIds: [], products: {} });
        const uid = await currentUserId();
        if (uid) {
          await supabase.from('wishlist_items').delete().eq('user_id', uid);
        }
      },
    }),
    {
      name: 'gegeen_wishlist_v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);

export const useWishlistCount = () =>
  useWishlistStore((s) => s.productIds.length);

// Backwards-compat alias: existing components may call `toggle()` to add/remove.
// `toggleItem` is the per-product action; `toggle()` (drawer toggle) is new.
// Keep this name for any caller still using the original signature.
export function useWishlistToggle() {
  return useWishlistStore((s) => s.toggleItem);
}
