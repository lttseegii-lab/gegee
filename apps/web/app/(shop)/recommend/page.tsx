import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MOODS } from '@/lib/moods';
import { scoreProducts } from '@/lib/recommend';
import { ProductCard } from '@/components/product/ProductCard';
import { RecommendForm } from '@/components/home/RecommendForm';

export const metadata = { title: 'AI санал болгоно' };

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    mood?: string;
    budget?: string;
  };
}) {
  const q = (searchParams.q ?? '').trim();
  const mood = searchParams.mood ?? undefined;
  const budget = searchParams.budget ? parseInt(searchParams.budget, 10) : undefined;

  let results: Awaited<ReturnType<typeof scoreProducts>> = [];
  if (q || mood) {
    const supabase = createClient();
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);
    results = scoreProducts(products ?? [], { query: q, mood, budget });
  }

  const top = results.slice(0, 6);

  return (
    <main className="max-w-container mx-auto px-6 py-10">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Нүүр</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">AI санал</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
          AI Concierge
        </p>
        <h1 className="font-serif italic text-4xl mb-3">
          Хэн рүү, ямар сэтгэлээр?
        </h1>
        <p className="text-ink/70">
          Хоосон мөрөнд "Ээждээ, 150,000₮ дотор, дулаан өнгөтэй, elegant
          баглаа" гэх мэтээр энгийнээр бичсэн ч AI санал болгоно.
        </p>
      </header>

      <RecommendForm
        initialQuery={q}
        initialMood={mood ?? null}
        initialBudget={budget?.toString() ?? ''}
        moods={MOODS}
      />

      {(q || mood) && (
        <section className="mt-10">
          {results.length === 0 ? (
            <div className="text-center py-16 text-sm text-ink/50">
              Тохирох санал олдсонгүй. Илүү дэлгэрэнгүй бичээд үзнэ үү.
            </div>
          ) : (
            <>
              <h2 className="font-serif italic text-2xl mb-1">
                Танд тохирох {top.length} санал
              </h2>
              <p className="text-sm text-ink/60 mb-6">
                Sort: тохирох оноо, дараа нь рейтинг
              </p>
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
