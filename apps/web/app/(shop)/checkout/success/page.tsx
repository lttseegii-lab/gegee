import Link from 'next/link';

export const metadata = { title: 'Захиалга баталгаажлаа' };

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderCode?: string };
}) {
  const code = searchParams.orderCode;

  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="text-6xl mb-6">🌸</div>
      <h1 className="font-serif italic text-3xl mb-3">Баярлалаа!</h1>
      <p className="text-ink/70 mb-2">Таны захиалга амжилттай үүслээ.</p>
      {code && (
        <p className="text-sm text-ink/50 mb-8">
          Захиалгын дугаар: <span className="font-mono text-ink">{code}</span>
        </p>
      )}

      <div className="bg-mint/30 rounded-card p-5 mb-8 text-sm text-ink/80">
        💡 <strong>Дараагийн алхам:</strong> Sprint 4-ийн QPay интеграц
        нэмэгдмэгц энэ хуудаснаас шууд QR scan хийж төлбөр төлөх боломжтой болно.
      </div>

      <div className="space-y-3">
        <Link href="/account/orders" className="btn-primary w-full">
          Захиалгуудаа харах →
        </Link>
        <Link href="/" className="btn-ghost w-full">
          Нүүр хуудас
        </Link>
      </div>
    </main>
  );
}
