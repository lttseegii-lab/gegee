import Link from 'next/link';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = { title: 'Шинэ бүтээгдэхүүн' };

export default function NewProductPage() {
  return (
    <div className="p-8 max-w-5xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin/products" className="hover:text-ink">Бүтээгдэхүүн</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Шинэ</span>
      </nav>
      <h1 className="font-serif italic text-4xl mb-8">Шинэ бүтээгдэхүүн</h1>
      <ProductForm mode="create" />
    </div>
  );
}
