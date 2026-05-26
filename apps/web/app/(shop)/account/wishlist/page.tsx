import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';

export const metadata = { title: 'Хадгалсан' };

export default async function WishlistPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/wishlist');

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

  // Re-sort by wishlist add_at order
  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const sorted = ids
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <main className="max-w-container mx-auto px-6 py-12">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/account/profile" className="hover:text-ink">
          Хувийн мэдээлэл
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Хадгалсан</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-serif italic text-4xl">Хадгалсан</h1>
        <p className="text-sm text-ink/60 mt-2">
          {sorted.length === 0
            ? 'Та одоохондоо юу ч хадгалаагүй байна'
            : `${sorted.length} бүтээгдэхүүн`}
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
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
    </main>
  );
}
