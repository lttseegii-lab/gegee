'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { createClient } from '@/lib/supabase/client';

/**
 * CartProvider — runs once at app boot. Hydrates cart from server (if logged in)
 * and subscribes to realtime changes for cross-device sync.
 *
 * Also merges localStorage cart into server on SIGNED_IN.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    // Initial hydrate
    useCartStore.getState().hydrate();

    // Auth state listener — merge guest cart on login
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
          await useCartStore.getState().mergeToServer();
        } else if (event === 'SIGNED_OUT') {
          // Clear local cart on signout for privacy
          // (alternative: keep as guest cart)
          await useCartStore.getState().refresh();
        }
      }
    );

    // Realtime cart sync — listen for changes from other devices
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel('cart-sync')
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
    })();

    return () => {
      subscription.subscription.unsubscribe();
      if (channel) channel.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
