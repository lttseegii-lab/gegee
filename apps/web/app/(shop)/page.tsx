import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/product/ProductGrid';

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
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('reviews', { ascending: false })
    .limit(8);

  return (
    <main>
      {/* Hero */}
      <section className="bg-blush">
        <div className="max-w-container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[13px] uppercase tracking-[0.2em] text-ink/60 mb-4">
              AI Atelier · est. 2026
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05] text-ink">
              Цэцэг илгээ. <em className="font-serif italic">Урлагийг задал.</em>
            </h1>
            <p className="mt-6 text-ink/70 text-lg max-w-md">
              AI чиний хайр, баяр, талархлыг ойлгож хамгийн тохирох цэцгийг
              сонгож өгнө. Letterbox-аас атриум хүртэл.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/catalog/all" className="btn-primary">
                Цэцэг үзэх
              </Link>
              <Link href="/diy" className="btn-ghost">
                Өөрийн гараар →
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-ink/60">
              <span>★ 4.9 / 5</span>
              <span>·</span>
              <span>12,000+ хэрэглэгч</span>
              <span>·</span>
              <span>B Corp</span>
            </div>
          </div>
          <div className="aspect-square bg-white/40 rounded-card overflow-hidden">
            {/* Hero image — replace with real asset in Sprint 5 */}
            <div className="w-full h-full flex items-center justify-center text-pinkHot text-9xl">
              ✻
            </div>
          </div>
        </div>
      </section>

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
