'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Polls the QPay webhook endpoint every 3s to check if the order was paid.
 * Redirects to /checkout/success once the payment is confirmed.
 *
 * On the server, the webhook endpoint queries QPay's payment_check API
 * (so it is authoritative and idempotent).
 */
export function PaymentPoller({
  orderId,
  orderCode,
  intervalMs = 3000,
  maxAttempts = 200, // ~10 minutes
}: {
  orderId: number;
  orderCode: string;
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    let active = true;

    async function tick() {
      if (!active || attempts >= maxAttempts) return;
      attempts++;
      try {
        const res = await fetch(`/api/qpay-webhook?orderId=${orderId}`, {
          method: 'POST',
          cache: 'no-store',
        });
        const data = await res.json();
        if (data?.ok && (data.payment_id || data.already_paid)) {
          active = false;
          router.push(`/checkout/success?orderCode=${orderCode}`);
          return;
        }
      } catch {
        // ignore network errors; keep polling
      }
      if (active) setTimeout(tick, intervalMs);
    }

    setTimeout(tick, intervalMs);

    return () => {
      active = false;
    };
  }, [orderId, orderCode, intervalMs, maxAttempts, router]);

  return null;
}
