'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createOrderFromCart } from '@/app/(shop)/checkout/actions';
import type { AddressRow } from '@/types/database';
import { useCartStore } from '@/stores/cartStore';
import {
  readCardMessageDraft,
  clearCardMessageDraft,
} from './CardMessageEditor';
import { DeliverySlotPicker, type DeliveryPlan } from './DeliverySlotPicker';

export function CheckoutForm({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null
  );
  const [notes, setNotes] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [delivery, setDelivery] = useState<DeliveryPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const clearLocalCart = useCartStore((s) => s.clear);

  // Load the card message draft, and re-read it whenever the window regains
  // focus (returning from the card step / another tab) so the preview and the
  // submitted note never go stale.
  useEffect(() => {
    setCardMessage(readCardMessageDraft());
    const onFocus = () => setCardMessage(readCardMessageDraft());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  function submit() {
    if (!selectedId) {
      setError('Хаяг сонгоно уу');
      return;
    }
    // Surprise gifts don't require the recipient's phone — the courier can use
    // the buyer's address phone. Otherwise a recipient phone is required.
    if (
      !delivery?.is_surprise &&
      (!delivery?.recipient_phone || delivery.recipient_phone.trim().length < 6)
    ) {
      setError('Хүлээн авагчийн утсыг бөглөнө үү');
      return;
    }
    setError(null);
    // Re-read the latest draft at submit time so a late edit isn't dropped.
    const latestCardMessage = readCardMessageDraft() || cardMessage;
    startTransition(async () => {
      const res = await createOrderFromCart({
        addressId: selectedId,
        notes: notes || undefined,
        cardMessage: latestCardMessage || undefined,
        delivery: delivery ?? undefined,
      });
      if (!res.ok) {
        setError(res.error ?? 'Алдаа гарлаа');
        return;
      }
      // Clear client-side cart cache + card message draft
      await clearLocalCart();
      clearCardMessageDraft();
      // Route to QPay payment page (auto-generates invoice + shows QR)
      router.push(`/checkout/payment?orderId=${res.orderId}`);
    });
  }

  if (addresses.length === 0) {
    return (
      <div className="border border-border rounded-card p-8">
        <p className="text-ink/60 mb-4">
          Хүргэлтийн хаяг бүртгээгүй байна. Эхлээд хаяг нэмнэ үү.
        </p>
        <Link href="/account/addresses" className="btn-primary inline-flex">
          Хаяг нэмэх →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Address selection */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Хүргэлтийн хаяг</h2>
          <Link
            href="/account/addresses"
            className="text-sm text-ink/60 hover:text-ink"
          >
            + Шинэ хаяг
          </Link>
        </div>
        <ul className="space-y-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <label
                className={`block border rounded-card p-4 cursor-pointer transition-colors ${
                  selectedId === a.id
                    ? 'border-ink bg-blush/30'
                    : 'border-border hover:border-ink/40'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={a.id}
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{a.label}</span>
                  {a.is_default && (
                    <span className="text-[10px] uppercase bg-mint text-ink px-2 py-0.5 rounded">
                      үндсэн
                    </span>
                  )}
                </div>
                <div className="text-sm text-ink/70">
                  {a.recipient} · {a.phone}
                </div>
                <div className="text-sm text-ink/60">
                  {[a.city, a.district, a.khoroo, a.building]
                    .filter(Boolean)
                    .join(', ')}
                  {[a.entrance && `${a.entrance} орц`, a.floor && `${a.floor} давхар`, a.unit && `${a.unit} тоот`]
                    .filter(Boolean)
                    .join(', ') && (
                    <>
                      {' · '}
                      {[a.entrance && `${a.entrance} орц`, a.floor && `${a.floor} давхар`, a.unit && `${a.unit} тоот`]
                        .filter(Boolean)
                        .join(', ')}
                    </>
                  )}
                </div>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* Delivery slot */}
      <section>
        <h2 className="font-medium mb-3">Хүргэлтийн цаг</h2>
        <DeliverySlotPicker onChange={setDelivery} />
      </section>

      {/* Card message preview (from step 3) */}
      {cardMessage && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Card-ын мессеж</h2>
            <Link
              href="/checkout?step=card"
              className="text-xs text-ink/60 hover:text-ink"
            >
              Засах →
            </Link>
          </div>
          <div className="bg-blush/40 border border-border rounded-card px-4 py-3 text-sm italic text-ink/80">
            “{cardMessage}”
          </div>
        </section>
      )}

      {/* Notes */}
      <section>
        <h2 className="font-medium mb-3">Нэмэлт тэмдэглэл</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="Жишээ нь: ажилдаа байх цаг 14:00-аас 18:00"
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </section>

      {error && (
        <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending || !selectedId}
        className="btn-primary w-full"
      >
        {isPending ? 'Захиалга үүсгэж байна…' : 'Захиалга үүсгэх'}
      </button>

      <p className="text-xs text-ink/40 text-center">
        Захиалга үүсгэснээр та манай{' '}
        <Link href="/legal/terms" className="underline">Үйлчилгээний нөхцөл</Link>{' '}
        ба{' '}
        <Link href="/legal/privacy" className="underline">Нууцлалын бодлогыг</Link>{' '}
        зөвшөөрсөнд тооцно.
      </p>
    </div>
  );
}
