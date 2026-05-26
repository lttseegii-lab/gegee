'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { createClient } from '@/lib/supabase/client';

/**
 * CartProvider — runs once at app boot. Hydrates cart from server (if logged in)
 * and subscribes to realtime changes for cross-device sync.
 *
 * Also merges localStorage cart into server on SIGNED_IN.
 *
 * Strict-mode safe: uses a per-mount unique channel name + cancelled guard
 * so React 18 double-invoke in dev doesn't try to .on() an already-subscribed
 * channel (which Supabase Realtime forbids).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    // Initial hydrate (cart + wishlist in parallel)
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();

    // Auth state listener — merge guest cart + wishlist on login
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await Promise.all([
            useCartStore.getState().mergeToServer(),
            useWishlistStore.getState().mergeToServer(),
          ]);
        } else if (event === 'SIGNED_OUT') {
          await Promise.all([
            useCartStore.getState().refresh(),
            useWishlistStore.getState().refresh(),
          ]);
        }
      }
    );

    // Realtime cart sync — unique channel per mount avoids strict-mode collisions
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const channelName = `cart-sync-${user.id}-${Math.random().toString(36).slice(2, 8)}`;
      const ch = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            useCartStore.getState().refresh();
          }
        )
        .subscribe();

      if (cancelled) {
        supabase.removeChannel(ch);
        return;
      }
      realtimeChannel = ch;
    })();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  return <>{children}</>;
}
