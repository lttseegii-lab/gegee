import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CATALOG_CONFIG,
  matchesFilter,
  sortProducts,
  type CategoryKey,
  type SortKey,
  type FilterDef,
} from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SortDropdown } from '@/components/catalog/SortDropdown';

const VALID_CATEGORIES: CategoryKey[] = [
  'all',
  'flowers',
  'plants',
  'gifts',
  'cards',
  'subs',
];

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}) {
  const cfg = CATALOG_CONFIG[params.category as CategoryKey];
  if (!cfg) return { title: 'Catalog' };
  return {
    title: cfg.title,
    description: cfg.description ?? `Gegeen — ${cfg.title}`,
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { filter?: string; sort?: string };
}) {
  const category = params.category as CategoryKey;
  if (!VALID_CATEGORIES.includes(category)) notFound();

  const cfg = CATALOG_CONFIG[category];
  const activeFilter = searchParams.filter ?? 'all';
  const sortBy = (searchParams.sort as SortKey) ?? 'popular';

  // Server-side fetch — base products filtered by category tags
  const supabase = createClient();
  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true);

  if (cfg.baseTags && cfg.baseTags.length > 0) {
    query = query.overlaps('tags', cfg.baseTags);
  }

  const { data: baseProducts, error } = await query;
  if (error) {
    console.error('Catalog query error:', error);
  }

  const allProducts = baseProducts ?? [];

  // Apply current filter + sort
  const activeFilterDef =
    (cfg.filters.find(
      (f): f is FilterDef => f !== '__div__' && f.key === activeFilter
    ) as FilterDef | undefined) ?? { key: 'all', label: 'Бүгд' };

  const filtered = allProducts.filter((p) => matchesFilter(p, activeFilterDef));
  const products = sortProducts(filtered, sortBy);

  return (
    <main className="max-w-container mx-auto px-6 py-8 pb-20">
      <div className="flex items-end justify-between flex-wrap gap-5 mb-7">
        <div>
          <h1 className="font-serif italic text-4xl text-ink leading-tight">
            {cfg.title}
          </h1>
          <p className="text-[13px] text-ink/60 mt-1.5">
            {products.length} бүтээгдэхүүн
          </p>
        </div>
        <SortDropdown value={sortBy} />
      </div>

      <ProductGrid products={products} />
    </main>
  );
}
