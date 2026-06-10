'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { createClient } from '@/lib/supabase/client';

/**
 * CartProvider — runs once at app boot. Hydrates cart from server (if logged in)
 * and subscribes to realtime changes for cross-device sync.
 *
 * The realtime channel is (re)bound on auth changes — not just at boot — so
 * cross-device sync works for users who sign in AFTER the app loads (the common
 * path: browse as guest, then log in). It's torn down on sign-out.
 *
 * Strict-mode safe: uses a per-bind unique channel name + cancelled guard so
 * React 18 double-invoke in dev doesn't try to .on() an already-subscribed
 * channel (which Supabase Realtime forbids).
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    function teardownChannel() {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    }

    async function subscribeForUser(userId: string) {
      teardownChannel();
      const channelName = `cart-sync-${userId}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const ch = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${userId}`,
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
    }

    // Initial hydrate (cart + wishlist in parallel)
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();

    // Auth state listener — merge guest data + (re)bind the realtime channel
    // on login, tear it down on logout.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await Promise.all([
            useCartStore.getState().mergeToServer(),
            useWishlistStore.getState().mergeToServer(),
          ]);
          if (session?.user) await subscribeForUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          teardownChannel();
          await Promise.all([
            useCartStore.getState().refresh(),
            useWishlistStore.getState().refresh(),
          ]);
        }
      }
    );

    // Subscribe immediately if already logged in at boot.
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      await subscribeForUser(user.id);
    })();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
      teardownChannel();
    };
  }, []);

  return <>{children}</>;
}
