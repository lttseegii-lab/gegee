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
import { getMenuSubcategories } from '@/lib/theme/getTheme';
import { resolveMood } from '@/lib/moods';
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
    description: cfg.description ?? `Thanks — ${cfg.title}`,
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { filter?: string; sort?: string; mood?: string };
}) {
  const category = params.category as CategoryKey;
  if (!VALID_CATEGORIES.includes(category)) notFound();

  const cfg = CATALOG_CONFIG[category];
  const activeFilter = searchParams.filter ?? 'all';
  const sortBy = (searchParams.sort as SortKey) ?? 'popular';
  const mood = resolveMood(searchParams.mood);

  // Server-side fetch — base products filtered by category tags
  // Merge static baseTags with admin-defined subcategory tags so admin can
  // tag products into this category without modifying CATALOG_CONFIG.
  const supabase = createClient();
  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true);

  let effectiveBaseTags = cfg.baseTags ?? null;
  if (category !== 'all') {
    try {
      const subs = await getMenuSubcategories();
      const catSubs = subs[category as Exclude<CategoryKey, 'all'>] ?? [];
      const subTags = catSubs.map((s) => s.tag);
      const merged = Array.from(new Set([...(cfg.baseTags ?? []), ...subTags]));
      if (merged.length > 0) effectiveBaseTags = merged;
    } catch {
      /* fall back to static cfg.baseTags */
    }
  }

  if (effectiveBaseTags && effectiveBaseTags.length > 0) {
    query = query.overlaps('tags', effectiveBaseTags);
  }

  const { data: baseProducts, error } = await query;
  if (error) {
    console.error('Catalog query error:', error);
  }

  const allProducts = baseProducts ?? [];

  // Resolve activeFilter into a FilterDef. Priority order:
  //   1. "all" → no filter
  //   2. Hardcoded CATALOG_CONFIG.filters (legacy chips: letterbox, premium, etc.)
  //   3. Admin-defined subcategory whose tag OR key matches
  //   4. Fall back: treat the raw filter string as a tag (so any tag you add
  //      via the admin theme picker filters correctly even without a chip).
  let activeFilterDef: FilterDef;
  let activeFilterLabel: string | null = null;

  if (activeFilter === 'all') {
    activeFilterDef = { key: 'all', label: 'Бүгд' };
  } else {
    const hardcoded = cfg.filters.find(
      (f): f is FilterDef => f !== '__div__' && f.key === activeFilter
    );
    if (hardcoded) {
      activeFilterDef = hardcoded;
      activeFilterLabel = hardcoded.label;
    } else {
      // Look up admin-defined subcategory for a friendly label
      try {
        const subs = await getMenuSubcategories();
        const catSubs = subs[category as Exclude<CategoryKey, 'all'>] ?? [];
        const match = catSubs.find(
          (s) => s.tag === activeFilter || s.key === activeFilter
        );
        if (match) activeFilterLabel = match.label;
      } catch {
        /* ignore — fall through to tag-based filter */
      }

      // Tag-based filter: products with this tag in their `tags` array
      activeFilterDef = {
        key: activeFilter,
        label: activeFilterLabel ?? activeFilter,
        tags: [activeFilter],
      };
    }
  }

  let filtered = allProducts.filter((p) => matchesFilter(p, activeFilterDef));

  // Mood filter (orthogonal to the regular filter chip)
  if (mood) {
    filtered = filtered.filter((p) => {
      const pTags = p.tags ?? [];
      const pOcc = p.occasion ?? [];
      return mood.tags.some(
        (t) => pTags.includes(t) || pOcc.includes(t)
      );
    });
  }

  const products = sortProducts(filtered, sortBy);

  return (
    <main className="max-w-container mx-auto px-6 py-8 pb-20">
      <div className="flex items-end justify-between flex-wrap gap-5 mb-7">
        <div>
          <h1 className="font-serif italic text-4xl text-ink leading-tight">
            {cfg.title}
            {activeFilterLabel && (
              <span className="text-ink/40 font-serif italic text-2xl ml-3">
                · {activeFilterLabel}
              </span>
            )}
            {mood && (
              <span className="text-ink/40 font-serif italic text-2xl ml-3">
                · {mood.emoji} {mood.label}
              </span>
            )}
          </h1>
          <p className="text-[13px] text-ink/60 mt-1.5">
            {products.length} бүтээгдэхүүн
            {mood && (
              <>
                {' · '}
                <span className="italic text-ink/40">{mood.description}</span>
              </>
            )}
          </p>
        </div>
        <SortDropdown value={sortBy} />
      </div>

      <ProductGrid products={products} />
    </main>
  );
}
