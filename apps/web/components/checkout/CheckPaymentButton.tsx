'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Manual "I've paid — check now" button. Forces a single authoritative QPay
 * check (status?verify=1) and redirects to success when confirmed. Useful when
 * the callback is delayed, or in local dev where QPay can't reach the callback.
 */
export function CheckPaymentButton({
  orderId,
  orderCode,
}: {
  orderId: number;
  orderCode: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/qpay/status?orderId=${orderId}&verify=1`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data?.paid) {
        router.push(`/checkout/success?orderCode=${orderCode}`);
        return;
      }
      setMsg('Төлбөр хараахан баталгаажаагүй байна. Төлсөн бол хэдэн секунд хүлээгээд дахин шалгана уу.');
    } catch {
      setMsg('Шалгахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={check}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? 'Шалгаж байна…' : 'Төлбөр төлсөн — шалгах'}
      </button>
      {msg && <p className="text-xs text-ink/60 mt-2">{msg}</p>}
    </div>
  );
}
