import { DiyBuilder } from '@/components/diy/DiyBuilder';
import { getDiyCatalog } from '@/lib/diy/getDiyCatalog';

export const metadata = { title: 'Өөрийн гараар' };

export default async function DiyPage() {
  const { flowers, wraps } = await getDiyCatalog();
  return (
    <main className="max-w-container mx-auto px-6 py-10">
      <header className="mb-10 max-w-2xl">
        <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
          AI Atelier ✻ Build your own
        </p>
        <h1 className="font-serif italic text-4xl mb-3">
          Өөрийн гараар
        </h1>
        <p className="text-ink/70">
          Хүссэн цэцгээ сонго, боолтоо тааруулаад AI 3 өөр загвар бэлдэнэ.
          Хамгийн таалагдсаныг сонгоод захиалаарай.
        </p>
      </header>

      <DiyBuilder flowers={flowers} wraps={wraps} />
    </main>
  );
}
