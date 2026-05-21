'use client';

import { useState, useTransition } from 'react';
import { createAddress } from '@/app/(shop)/account/addresses/actions';

export function AddressForm({ onCreated }: { onCreated?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handle(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createAddress(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        const form = document.getElementById('address-form') as HTMLFormElement;
        form?.reset();
        onCreated?.();
      }
    });
  }

  return (
    <form id="address-form" action={handle} className="border border-border rounded-card p-6 space-y-4 mb-6">
      <h3 className="font-medium text-lg">Шинэ хаяг нэмэх</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="label" label="Нэр" placeholder="Гэр / Ажил" defaultValue="Гэр" />
        <Field name="recipient" label="Хүлээн авагч" placeholder="Бат Болд" required />
      </div>

      <Field name="phone" label="Утас" placeholder="+976 9999 9999" required />

      <div className="grid sm:grid-cols-3 gap-4">
        <Field name="city" label="Хот" defaultValue="Улаанбаатар" />
        <Field name="district" label="Дүүрэг" placeholder="Сүхбаатар" />
        <Field name="khoroo" label="Хороо" placeholder="3-р хороо" />
      </div>

      <Field name="building" label="Барилга, гудамж" placeholder="Олимп 25" />

      <div className="grid grid-cols-3 gap-4">
        <Field name="entrance" label="Орц" placeholder="2" />
        <Field name="floor" label="Давхар" placeholder="5" />
        <Field name="unit" label="Тоот" placeholder="52" />
      </div>

      <Field
        name="notes"
        label="Нэмэлт тэмдэглэл"
        placeholder="Хаалга цэнхэр өнгөтэй"
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" className="rounded" />
        Үндсэн хаяг болгох
      </label>

      {error && (
        <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Хадгалж байна…' : 'Хаяг нэмэх'}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
        {label}
        {required && <span className="text-pinkHot ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
      />
    </div>
  );
}
