'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/app/account/profile/actions';

type Props = {
  name: string;
  email: string;
  phone: string | null;
  providerLabel: string;
  joinedAt: string | null;
};

export function ProfileInfoCard({
  name: initialName,
  email,
  phone: initialPhone,
  providerLabel,
  joinedAt,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic local state so the header avatar/sidebar doesn't lag if router
  // revalidation takes a beat.
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone ?? '');

  function handle(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      // Sync local view-mode values
      setName(String(formData.get('name') ?? '').trim());
      setPhone(String(formData.get('phone') ?? '').trim());
      setEditing(false);
    });
  }

  function cancel() {
    setError(null);
    setName(initialName);
    setPhone(initialPhone ?? '');
    setEditing(false);
  }

  return (
    <section className="bg-offwhite rounded-card p-6 mb-6">
      <header className="flex items-center justify-between mb-5">
        <h3 className="font-medium">Хувийн мэдээлэл</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-border bg-white hover:border-ink transition-colors"
          >
            Засварлах
          </button>
        )}
      </header>

      {editing ? (
        <form action={handle} className="space-y-4">
          <Field
            name="name"
            label="Нэр"
            defaultValue={name}
            required
            maxLength={80}
            autoFocus
          />
          <Field
            name="phone"
            label="Утас"
            defaultValue={phone}
            placeholder="+976 9999 9999"
            type="tel"
          />

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/70">
            <ReadOnlyRow label="Имэйл" value={email} />
            <ReadOnlyRow label="Нэвтэрсэн арга" value={providerLabel} />
          </div>

          {error && (
            <div className="text-sm text-pinkHot bg-blush rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? 'Хадгалж байна…' : 'Хадгалах'}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="text-sm text-ink/60 hover:text-ink"
            >
              Цуцлах
            </button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-border/70">
          <Row label="Нэр" value={name} />
          <Row label="Имэйл" value={email} />
          <Row label="Утас" value={phone} emptyHint="оруулаагүй" />
          <Row label="Нэвтэрсэн арга" value={providerLabel} />
          <Row label="Бүртгүүлсэн огноо" value={joinedAt} />
        </dl>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  emptyHint,
}: {
  label: string;
  value: string | null;
  emptyHint?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <dt className="text-ink/60">{label}</dt>
      <dd className={`font-medium ${value ? 'text-ink' : 'text-ink/40'}`}>
        {value || emptyHint || '—'}
      </dd>
    </div>
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">
        {label}
      </div>
      <div className="text-sm text-ink/70">{value}</div>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  required,
  maxLength,
  type = 'text',
  autoFocus,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1.5">
        {label}
        {required && <span className="text-pinkHot ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-ink"
      />
    </div>
  );
}
