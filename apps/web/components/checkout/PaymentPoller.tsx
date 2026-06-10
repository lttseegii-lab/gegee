'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Polls the order status every 3s and redirects to /checkout/success once paid.
 *
 * Each tick reads our DB status (cheap, no QPay call). Every 5th tick (~15s) it
 * forces a real QPay check as a fallback in case the QPay callback was missed or
 * can't reach us (e.g. localhost without a public URL). QPay forbids hammering
 * payment/check, so the real check stays infrequent and stops once paid.
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
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let active = true;

    async function tick() {
      if (!active) return;
      if (attempts >= maxAttempts) {
        setTimedOut(true);
        return;
      }
      attempts++;
      const verify = attempts % 5 === 0 ? '&verify=1' : '';
      try {
        const res = await fetch(
          `/api/qpay/status?orderId=${orderId}${verify}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (data?.paid) {
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

  if (timedOut) {
    return (
      <div className="mb-6 border border-goldDeep/30 bg-yellow-pale rounded-card p-4 text-sm text-ink/80">
        Автомат шалгалтын хугацаа дууслаа. Төлбөрөө хийсэн бол доорх «Төлбөр
        шалгах» товчоор шалгана уу.
      </div>
    );
  }
  return null;
}
