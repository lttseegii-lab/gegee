import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { productImageUrl } from '@/lib/ai/pollinations';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('name')
    .eq('id', params.id)
    .single();
  return { title: data?.name ?? 'Бүтээгдэхүүн' };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('active', true)
    .single();

  if (!product) notFound();

  const imageUrl = productImageUrl(product, 1000, 1000);
  const stars = '★'.repeat(Math.floor(product.rating ?? 0));

  return (
    <main className="max-w-container mx-auto px-6 py-10">
      <nav className="text-[13px] text-ink/60 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">
          Нүүр
        </Link>
        <span className="text-ink/30">›</span>
        <Link href="/catalog/all" className="hover:text-ink">
          Бүгд
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="relative aspect-square bg-lilac/40 rounded-card overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            unoptimized={imageUrl.includes('pollinations.ai')}
            priority
          />
        </div>

        <div>
          <h1 className="font-serif text-4xl mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm text-ink/60 mb-6">
            <span className="text-goldDeep">{stars}</span>
            <span>
              {product.rating?.toFixed(1) ?? '—'} · {(product.reviews ?? 0).toLocaleString()} review
            </span>
            {product.pet_safe && (
              <>
                <span>·</span>
                <span>🐾 Pet-safe</span>
              </>
            )}
          </div>

          <div className="mb-8">
            <span className="text-[13px] text-ink/40 mr-2">эхлэл</span>
            <span className="text-3xl font-semibold">
              {product.price.toLocaleString()}₮
            </span>
          </div>

          <div className="flex items-center gap-4 mb-10">
            <AddToCartButton productId={product.id} variant="full" />
            <button
              className="w-12 h-12 border border-border rounded-full text-ink hover:border-ink"
              aria-label="Хадгалах"
              type="button"
            >
              ♡
            </button>
          </div>

          {(product.tags?.length ?? 0) > 0 && (
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-2">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {product.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-full bg-offwhite border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-6 space-y-3 text-sm text-ink/70">
            <div className="flex items-center gap-2">
              <span>🚚</span> UB-н дотор 15 минутын нарийвчлалтай хүргэлт
            </div>
            <div className="flex items-center gap-2">
              <span>📦</span> 100,000₮-аас дээш үнэгүй хүргэлт
            </div>
            <div className="flex items-center gap-2">
              <span>🌿</span> 100% recyclable боолт
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
