import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-container mx-auto px-6 py-32 text-center">
      <div className="text-7xl text-pinkHot mb-6">✻</div>
      <h1 className="font-serif italic text-4xl mb-4">Уучлаарай…</h1>
      <p className="text-ink/60 mb-10 max-w-md mx-auto">
        Хайж буй хуудас тань олдсонгүй. Хамгийн алдартай цэцгүүдийг харна уу.
      </p>
      <Link href="/catalog/all" className="btn-primary">
        Цэцэг үзэх →
      </Link>
    </main>
  );
}
