'use client';

import { useTransition } from 'react';
import { deleteAddress, setDefaultAddress } from '@/app/(shop)/account/addresses/actions';

export function AddressActions({
  addressId,
  isDefault,
}: {
  addressId: number;
  isDefault: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm('Энэ хаягийг устгах уу?')) return;
    startTransition(async () => {
      await deleteAddress(addressId);
    });
  }

  function onSetDefault() {
    startTransition(async () => {
      await setDefaultAddress(addressId);
    });
  }

  return (
    <div className="flex items-center gap-3 mt-3 text-xs">
      {!isDefault && (
        <button
          type="button"
          onClick={onSetDefault}
          disabled={isPending}
          className="text-ink/60 hover:text-ink underline-offset-2 hover:underline"
        >
          Үндсэн болгох
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="text-ink/40 hover:text-pinkHot ml-auto"
      >
        Устгах
      </button>
    </div>
  );
}
