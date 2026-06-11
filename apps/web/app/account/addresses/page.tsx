import { createClient } from '@/lib/supabase/server';
import { AddressList } from '@/components/account/AddressList';

export const metadata = { title: 'Хаягууд' };

export default async function AddressesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-4xl mb-2">Хаягууд</h1>
      <p className="text-sm text-ink/60 mb-8">
        Хүргэлтийн хаягуудаа удирдах
      </p>

      <AddressList addresses={data ?? []} />
    </div>
  );
}
