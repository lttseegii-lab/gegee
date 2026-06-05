import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';
import { MoodPicker } from '@/components/home/MoodPicker';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { getHeroBanners } from '@/lib/theme/getTheme';

const COLLECTION_CIRCLES: { label: string; href: string; emoji: string }[] = [
  { label: 'Бүгд', href: '/catalog/all', emoji: '✻' },
  { label: 'Цэцэг', href: '/catalog/flowers', emoji: '🌸' },
  { label: 'Letterbox', href: '/catalog/flowers?filter=letterbox', emoji: '✉️' },
  { label: 'Hamper', href: '/catalog/gifts?filter=hamper', emoji: '🧺' },
  { label: 'Пион', href: '/catalog/flowers', emoji: '🌷' },
  { label: 'Карт', href: '/catalog/cards', emoji: '💌' },
  { label: 'Ургамал', href: '/catalog/plants', emoji: '🪴' },
  { label: 'Захиалгат', href: '/catalog/subs', emoji: '📦' },
];

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

      {/* Mood picker — "Care wildly" — Ямар мэдрэмж илэрхийлэх вэ */}
      <MoodPicker />

      {/* Collection circles */}
      <section className="border-b border-border">
        <div className="max-w-container mx-auto px-6 py-10">
          <ul className="flex items-start gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COLLECTION_CIRCLES.map((c) => (
              <li key={c.label} className="flex-shrink-0">
                <Link
                  href={c.href}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span className="w-20 h-20 rounded-full bg-lilac flex items-center justify-center text-3xl group-hover:bg-pinkHot/20 transition-colors">
                    {c.emoji}
                  </span>
                  <span className="text-sm text-ink">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
              Хайртай хүмүүсийнхээ <em>чухал огноог</em> мартахгүй
            </h2>
            <p className="text-ink/70 max-w-md">
              Ээжийн өдөр, ой тэмдэглэл, төрсөн өдөр — бид цаг тутамд сануулж,
              тэр хүн рүү тохирох баглааг санал болгоно.
            </p>
          </div>
          <Link href="/account/memory-garden" className="btn-primary whitespace-nowrap">
            Огноо нэмэх →
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
