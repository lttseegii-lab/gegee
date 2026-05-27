import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';

export const metadata = { title: 'Хадгалсан' };

export default async function WishlistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wl } = await supabase
    .from('wishlist_items')
    .select('product_id, added_at')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  const ids = (wl ?? []).map((w) => w.product_id);
  const { data: products } = ids.length
    ? await supabase
        .from('products')
        .select('*')
        .in('id', ids)
        .eq('active', true)
    : { data: [] };

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const sorted = ids
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-pinkHot mb-3">
        Хүсэлтийн жагсаалт
      </div>
      <h1 className="font-serif text-4xl mb-2">Хадгалсан</h1>
      <p className="text-sm text-ink/60 mb-8">
        {sorted.length === 0
          ? 'Та одоохондоо юу ч хадгалаагүй байна'
          : `${sorted.length} бүтээгдэхүүн`}
      </p>

      {sorted.length === 0 ? (
        <div className="bg-offwhite rounded-card p-12 text-center">
          <div className="text-5xl mb-4">♡</div>
          <p className="text-ink/60 mb-6">
            Бүтээгдэхүүн дээр ♡ дарж хадгалаарай
          </p>
          <Link href="/catalog/all" className="btn-primary">
            Цэцэг үзэх →
          </Link>
        </div>
      ) : (
        <ProductGrid products={sorted} />
      )}
    </div>
  );
}
