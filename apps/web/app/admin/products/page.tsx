import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { productImageUrl } from '@/lib/ai/pollinations';
import { ProductToggle } from '@/components/admin/ProductToggle';

export const metadata = { title: 'Бүтээгдэхүүн' };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? '';
  const tag = searchParams.tag?.trim() ?? '';

  let query = supabase.from('products').select('*').order('reviews', {
    ascending: false,
  });

  if (q) query = query.ilike('name', `%${q}%`);
  if (tag) query = query.contains('tags', [tag]);

  const { data: products } = await query;
  const active = (products ?? []).filter((p) => p.active).length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl">
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif italic text-4xl">Бүтээгдэхүүн</h1>
          <p className="text-sm text-ink/60 mt-1">
            {active} идэвхтэй / {products?.length ?? 0} нийт
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          + Шинэ
        </Link>
      </header>

      <form action="/admin/products" className="mb-5 flex items-center gap-3">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Нэрээр хайх..."
          className="border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink flex-1 max-w-sm"
        />
        <input
          name="tag"
          type="text"
          defaultValue={tag}
          placeholder="Tag-ээр шүүх..."
          className="border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-ink w-44"
        />
        {(q || tag) && (
          <Link
            href="/admin/products"
            className="text-xs text-ink/50 hover:text-ink"
          >
            Цэвэрлэх
          </Link>
        )}
      </form>

      <div className="bg-white border border-border rounded-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-offwhite text-xs uppercase tracking-wider text-ink/60">
            <tr>
              <th className="text-left px-5 py-3 w-16"></th>
              <th className="text-left px-5 py-3">Нэр</th>
              <th className="text-right px-5 py-3">Үнэ</th>
              <th className="text-left px-5 py-3">Badge</th>
              <th className="text-center px-5 py-3">Pet</th>
              <th className="text-center px-5 py-3">Active</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-offwhite/50">
                <td className="px-5 py-3">
                  <div className="relative w-10 h-10 rounded bg-lilac/40 overflow-hidden">
                    <Image
                      src={productImageUrl(p, 80, 80)}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium hover:text-pinkHot"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-ink/50 font-mono mt-0.5">
                    {p.id}
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-semibold">
                  {p.price.toLocaleString()}₮
                </td>
                <td className="px-5 py-3 text-xs">
                  {p.badge && (
                    <span className="px-2 py-0.5 rounded bg-yellow text-ink">
                      {p.badge}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {p.pet_safe && <span title="Pet-safe">🐾</span>}
                </td>
                <td className="px-5 py-3 text-center">
                  <ProductToggle id={p.id} active={p.active ?? false} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-ink/60 hover:text-ink text-xs"
                  >
                    Засах →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
