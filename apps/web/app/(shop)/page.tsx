import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { getHeroBanners } from '@/lib/theme/getTheme';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: products }, heroConfig] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('reviews', { ascending: false })
      .limit(8),
    getHeroBanners(),
  ]);

  return (
    <main>
      {/* Hero — admin-editable rotating carousel */}
      <HeroCarousel
        slides={heroConfig.slides}
        intervalMs={heroConfig.interval_ms}
      />

      {/* Bestsellers */}
      <section className="max-w-container mx-auto px-6 py-16">
        <div className="mb-8">
          <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
            Top of the atelier
          </p>
          <h2 className="font-serif text-3xl">
            Хамгийн <em className="italic">хайрлагдсан</em> бүтээгдэхүүн
          </h2>
          <p className="text-ink/60 mt-2 text-sm">
            12,000+ хэрэглэгчийн рейтинг шигшсэн manai signature цуглуулга.
          </p>
        </div>

        <ProductGrid products={products ?? []} />
      </section>

      {/* Memory Garden CTA */}
      <section className="bg-purpleSoft/40">
        <div className="max-w-container mx-auto px-6 py-16 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="max-w-xl">
            <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
              ✻ Мартаж болохгүй өдрүүд
            </p>
            <h2 className="font-serif italic text-3xl mb-3">
              Хайртай хүмүүсийнхээ <em>чухал өдрийг</em> битгий мартаарай
            </h2>
            <p className="text-ink/70 max-w-md">
              Ээжийн өдөр, ой тэмдэглэл, төрсөн өдөр — бид цаг тутамд сануулж,
              тэр хүн рүү тохирох баглааг санал болгоно.
            </p>
          </div>
          <Link href="/account/memory-garden" className="btn-primary whitespace-nowrap">
            Чухал өдөр нэмэх →
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-mint">
        <div className="max-w-container mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl mb-2">🌿</div>
            <div className="text-sm font-medium">Eco боолт</div>
            <div className="text-xs text-ink/60 mt-1">100% recyclable</div>
          </div>
          <div>
            <div className="text-2xl mb-2">🚚</div>
            <div className="text-sm font-medium">UB express</div>
            <div className="text-xs text-ink/60 mt-1">15 мин нарийвчлал</div>
          </div>
          <div>
            <div className="text-2xl mb-2">🐾</div>
            <div className="text-sm font-medium">Pet-safe filter</div>
            <div className="text-xs text-ink/60 mt-1">Тэжээвэртэй гэрт</div>
          </div>
          <div>
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium">AI concierge</div>
            <div className="text-xs text-ink/60 mt-1">Сэтгэлийг ойлгоно</div>
          </div>
        </div>
      </section>
    </main>
  );
}
