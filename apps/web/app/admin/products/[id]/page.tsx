import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: params.id };
}

export default async function AdminProductDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();
  if (!product) notFound();

  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin/products" className="hover:text-ink">Бүтээгдэхүүн</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium font-mono">{product.id}</span>
      </nav>
      <h1 className="font-serif italic text-4xl mb-8">{product.name}</h1>
      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
