'use client';

import { useTransition, useState } from 'react';
import { toggleProductActive } from '@/app/admin/products/actions';

export function ProductToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [optimistic, setOptimistic] = useState(active);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(async () => {
      const res = await toggleProductActive(id, next);
      if (res.error) setOptimistic(active);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        optimistic ? 'bg-sageDeep' : 'bg-ink/20'
      }`}
      aria-label={optimistic ? 'Идэвхтэй' : 'Идэвхгүй'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          optimistic ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
