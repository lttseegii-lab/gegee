'use client';

import { useState, useTransition } from 'react';
import { createAddress } from '@/app/account/addresses/actions';
import { UB_DISTRICTS, listKhoroos } from '@/lib/mn/districts';

export function AddressForm({ onCreated }: { onCreated?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [district, setDistrict] = useState<string>('');
  const khoroos = listKhoroos(district);

  function handle(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createAddress(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        const form = document.getElementById('address-form') as HTMLFormElement;
        form?.reset();
        setDistrict('');
        onCreated?.();
      }
    });
  }

  return (
    <form
      id="address-form"
      action={handle}
      className="border border-border rounded-card p-6 space-y-4 mb-6"
    >
      <h3 className="font-medium text-lg">Шинэ хаяг нэмэх</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          name="label"
          label="Нэр"
          placeholder="Гэр / Ажил"
          defaultValue="Гэр"
        />
        <Field
          name="recipient"
          label="Хүлээн авагч"
          placeholder="Бат Болд"
          required
        />
      </div>

      <Field name="phone" label="Утас" placeholder="+976 9999 9999" required />

      <div className="grid sm:grid-cols-3 gap-4">
        <Field name="city" label="Хот" defaultValue="Улаанбаатар" />

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Дүүрэг
          </label>
          <select
            name="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
          >
            <option value="">— Сонгох —</option>
            {UB_DISTRICTS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
            Хороо
          </label>
          <select
            name="khoroo"
            disabled={!district}
            className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink disabled:bg-ink/5 disabled:text-ink/40 disabled:cursor-not-allowed"
          >
            <option value="">
              {district ? '— Сонгох —' : 'Эхлээд дүүргээ'}
            </option>
            {khoroos.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
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
