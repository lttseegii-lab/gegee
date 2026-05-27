'use client';

import { useState } from 'react';
import { AddressForm } from './AddressForm';
import { AddressActions } from './AddressActions';

type Address = {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  city: string | null;
  district: string | null;
  khoroo: string | null;
  building: string | null;
  entrance: string | null;
  floor: string | null;
  unit: string | null;
  notes: string | null;
  is_default: boolean | null;
};

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-offwhite rounded-card p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Хүргэлтийн хаяг</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:border-ink transition-colors"
        >
          {showForm ? '× Хаах' : '+ Нэмэх'}
        </button>
      </header>

      {showForm && (
        <div className="mb-4">
          <AddressForm onCreated={() => setShowForm(false)} />
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-sm text-ink/50 text-center py-8">
          Та одоохондоо хаяг бүртгэлгүй байна
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="bg-white rounded-card p-4 border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-2xl shrink-0">
                    {labelEmoji(a.label)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{a.label}</span>
                      {a.is_default && (
                        <span className="text-[10px] uppercase tracking-wide bg-mint text-ink px-2 py-0.5 rounded">
                          үндсэн
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-ink/80">{a.recipient}</div>
                    <div className="text-xs text-ink/60 mt-0.5">{a.phone}</div>
                    <div className="text-xs text-ink/60 mt-1">
                      {[a.city, a.district, a.khoroo, a.building]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {(a.entrance || a.floor || a.unit) && (
                      <div className="text-xs text-ink/50">
                        {[
                          a.entrance && `${a.entrance} орц`,
                          a.floor && `${a.floor} давхар`,
                          a.unit && `${a.unit} тоот`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                    {a.notes && (
                      <div className="text-xs text-ink/40 mt-1 italic">
                        “{a.notes}”
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <AddressActions
                addressId={a.id}
                isDefault={a.is_default ?? false}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function labelEmoji(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('гэр') || l.includes('home')) return '🏠';
  if (l.includes('ажил') || l.includes('work') || l.includes('office')) return '🏢';
  return '📍';
}
