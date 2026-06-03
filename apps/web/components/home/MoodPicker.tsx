import Link from 'next/link';
import { MOODS } from '@/lib/moods';

export function MoodPicker() {
  return (
    <section className="bg-white py-12 border-y border-border">
      <div className="max-w-container mx-auto px-6">
        <header className="mb-8 text-center max-w-2xl mx-auto">
          <p className="text-[13px] uppercase tracking-[0.2em] text-ink/50 mb-2">
            Care wildly
          </p>
          <h2 className="font-serif italic text-3xl mb-3">
            Ямар <em>мэдрэмж</em> илэрхийлэх вэ?
          </h2>
          <p className="text-sm text-ink/60">
            Зөвхөн хэн нэгэнд биш — өөртөө илэрхийлэх ч сайхан. Сонголтоо
            хийгээд тэр сэтгэлд тохирох баглаа бид санал болгоно.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {MOODS.map((m) => (
            <Link
              key={m.key}
              href={`/catalog/all?mood=${m.key}`}
              className={`group flex flex-col items-center justify-center rounded-2xl p-4 hover:-translate-y-1 transition-transform ${m.bgClass}`}
            >
              <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {m.emoji}
              </span>
              <span className="font-medium text-sm text-ink text-center">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
