import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { scoreProducts, buildRecommendSummary } from '@/lib/recommend';
import { ProductCard } from '@/components/product/ProductCard';
import { RecommendForm } from '@/components/home/RecommendForm';

export const metadata = { title: 'AI санал болгоно' };

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    recipient?: string;
    occasion?: string;
    color?: string;
    budget?: string;
  };
}) {
  const q = (searchParams.q ?? '').trim();
  const recipient = searchParams.recipient || undefined;
  const occasion = searchParams.occasion || undefined;
  const color = searchParams.color || undefined;
  const budget = searchParams.budget
    ? parseInt(searchParams.budget, 10)
    : undefined;

  const hasInput = Boolean(q || recipient || occasion || color);

  let results: Awaited<ReturnType<typeof scoreProducts>> = [];
  if (hasInput) {
    const supabase = createClient();
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    results = scoreProducts(products ?? [], {
      query: q,
      recipient,
      occasion,
      color,
      budget,
    });
  }

  const top = results.slice(0, 6);
  const summary =
    hasInput && top.length > 0
      ? buildRecommendSummary({ recipient, occasion, color }, top.length)
      : null;

  return (
    <main className="max-w-container mx-auto px-6 py-10">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">
          Нүүр
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">AI санал</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
          AI Concierge
        </p>
        <h1 className="font-serif italic text-4xl mb-3">
          Хэнд, ямар учраар бэлэглэх вэ?
        </h1>
        <p className="text-ink/70">
          Хэдэн сонголт хийхэд л AI тухайн хүнд хамгийн тохирох баглааг санал
          болгоно.
        </p>
      </header>

      <RecommendForm
        initialRecipient={recipient ?? null}
        initialOccasion={occasion ?? null}
        initialColor={color ?? null}
        initialBudget={budget?.toString() ?? ''}
        initialQuery={q}
      />

      {hasInput && (
        <section className="mt-10">
          {results.length === 0 ? (
            <div className="text-center py-16 text-sm text-ink/50">
              Тохирох санал олдсонгүй. Өөр сонголт хийгээд үзнэ үү.
            </div>
          ) : (
            <>
              {summary && (
                <div className="mb-6 rounded-card border border-pinkHot/20 bg-gradient-to-r from-blush/70 to-offwhite p-5 flex items-start gap-3">
                  <span className="text-2xl leading-none">✨</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-pinkHot mb-1">
                      AI санал
                    </p>
                    <p className="font-serif italic text-xl text-ink leading-snug">
                      {summary}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {top.map((r) => (
                  <ProductCard key={r.product.id} product={r.product} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
