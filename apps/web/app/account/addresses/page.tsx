import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AddressForm } from '@/components/account/AddressForm';
import { AddressActions } from '@/components/account/AddressActions';

export const metadata = { title: 'Хаягууд' };

export default async function AddressesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/addresses');

  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  const addresses = data ?? [];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-serif italic text-4xl mb-8">Хаягууд</h1>

      <AddressForm />

      {addresses.length === 0 ? (
        <div className="border border-border rounded-card p-12 text-center">
          <div className="text-5xl mb-4">📍</div>
          <p className="text-ink/60">Та одоохондоо хаяг бүртгэлгүй байна</p>
        </div>
      ) : (
        <div>
          <h3 className="font-medium mb-4">Хадгалсан хаягууд</h3>
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li key={a.id} className="border border-border rounded-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{a.label}</span>
                  {a.is_default && (
                    <span className="text-[11px] uppercase tracking-wide bg-mint text-ink px-2 py-0.5 rounded">
                      үндсэн
                    </span>
                  )}
                </div>
                <div className="text-sm text-ink/70">
                  {a.recipient} · {a.phone}
                </div>
                <div className="text-sm text-ink/60 mt-1">
                  {[a.city, a.district, a.khoroo, a.building]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {(a.entrance || a.floor || a.unit) && (
                  <div className="text-sm text-ink/60">
                    {[a.entrance && `${a.entrance} орц`, a.floor && `${a.floor} давхар`, a.unit && `${a.unit} тоот`]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {a.notes && (
                  <div className="text-xs text-ink/50 mt-2 italic">
                    “{a.notes}”
                  </div>
                )}
                <AddressActions addressId={a.id} isDefault={a.is_default ?? false} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
