import type { Product } from '@/types/database';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  products,
  emptyText = 'Тохирох бүтээгдэхүүн олдсонгүй',
}: {
  products: Product[];
  emptyText?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-ink/50">{emptyText}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
