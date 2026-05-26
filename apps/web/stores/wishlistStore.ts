'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

interface WishlistState {
  productIds: string[];
  hydrated: boolean;
}

interface WishlistActions {
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  refresh: () => Promise<void>;
  hydrate: () => Promise<void>;
  mergeToServer: () => Promise<void>;
  clear: () => Promise<void>;
}

const supabase = createClient();

async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    (set, get) => ({
      productIds: [],
      hydrated: false,

      has: (productId) => get().productIds.includes(productId),

      toggle: async (productId) => {
        const current = get().productIds;
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        set({ productIds: next });

        const uid = await currentUserId();
        if (!uid) return;

        if (current.includes(productId)) {
          await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', uid)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('wishlist_items')
            .insert({ user_id: uid, product_id: productId });
        }
      },

      refresh: async () => {
        const uid = await currentUserId();
        if (!uid) {
          set({ hydrated: true });
          return;
        }
        const { data } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', uid);
        set({
          productIds: (data ?? []).map((r) => r.product_id),
          hydrated: true,
        });
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
        // Upsert each id (ON CONFLICT DO NOTHING via unique key)
        await supabase
          .from('wishlist_items')
          .upsert(
            local.map((product_id) => ({ user_id: uid, product_id })),
            { onConflict: 'user_id,product_id', ignoreDuplicates: true }
          );
        await get().refresh();
      },

      clear: async () => {
        set({ productIds: [] });
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
