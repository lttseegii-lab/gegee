'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/app/admin/orders/actions';
import type { OrderStatus } from '@/types/database';

const TRANSITIONS: Record<
  OrderStatus,
  { label: string; next: OrderStatus; style: string }[]
> = {
  pending_payment: [
    { label: '✓ Төлбөр баталгаажуулах', next: 'paid', style: 'bg-sageDeep text-white' },
    { label: 'Цуцлах', next: 'cancelled', style: 'border border-border text-ink/60' },
  ],
  paid: [
    { label: '🌸 Бэлдэж эхлэх', next: 'preparing', style: 'bg-pinkHot text-white' },
    { label: 'Буцаах', next: 'refunded', style: 'border border-border text-ink/60' },
    { label: 'Цуцлах', next: 'cancelled', style: 'border border-border text-ink/60' },
  ],
  preparing: [
    { label: '🚚 Хүргэлтэнд гаргах', next: 'shipped', style: 'bg-ink text-white' },
    { label: 'Цуцлах', next: 'cancelled', style: 'border border-border text-ink/60' },
  ],
  shipped: [
    { label: '✓ Хүргэгдсэн', next: 'delivered', style: 'bg-sageDeep text-white' },
    { label: 'Цуцлах', next: 'cancelled', style: 'border border-border text-ink/60' },
  ],
  delivered: [
    { label: 'Буцаах', next: 'refunded', style: 'border border-border text-ink/60' },
  ],
  cancelled: [],
  refunded: [],
};

export function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: OrderStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update(next: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next);
      if (res.error) setError(res.error);
    });
  }

  const options = TRANSITIONS[currentStatus] ?? [];

  if (options.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        Энэ статусаас цаашлуулах боломжгүй.
      </p>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.next}
            type="button"
            onClick={() => update(opt.next)}
            disabled={isPending}
            className={`w-full text-sm py-3 px-4 rounded-full transition-colors disabled:opacity-50 ${opt.style}`}
          >
            {isPending ? '…' : opt.label}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-3 text-xs text-pinkHot bg-blush rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
