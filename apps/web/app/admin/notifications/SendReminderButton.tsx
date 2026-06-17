'use client';

import { useState, useTransition } from 'react';
import { sendMemoryReminderSms } from './actions';

export function SendReminderButton({ memoryDateId }: { memoryDateId: number }) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await sendMemoryReminderSms(memoryDateId);
      setStatus(res.ok ? 'ok' : 'error');
      if (res.ok) setTimeout(() => setStatus('idle'), 3000);
    });
  }

  if (status === 'ok') {
    return <span className="text-xs text-green-600 font-medium">✓ Илгээгдлээ</span>;
  }
  if (status === 'error') {
    return <span className="text-xs text-pinkHot">✕ Алдаа</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg bg-ink text-white hover:bg-pinkHot transition-colors disabled:opacity-50"
    >
      {isPending ? '…' : 'SMS илгээх'}
    </button>
  );
}
