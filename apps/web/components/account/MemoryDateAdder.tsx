'use client';

import { useState } from 'react';
import { MemoryDateForm } from './MemoryDateForm';

export function MemoryDateAdder() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <MemoryDateForm
        onSaved={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full border-2 border-dashed border-border rounded-card py-6 text-sm text-ink/60 hover:border-ink hover:text-ink transition-colors"
    >
      + Мартаж болохгүй өдөр
    </button>
  );
}
