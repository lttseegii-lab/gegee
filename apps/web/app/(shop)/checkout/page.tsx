import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { requireOnboarded } from '@/lib/auth/requireOnboarding';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import {
  CheckoutStepIndicator,
  parseStep,
  type CheckoutStep,
} from '@/components/checkout/CheckoutSteps';
import { UpsellList } from '@/components/checkout/UpsellList';
import { CardMessageEditor } from '@/components/checkout/CardMessageEditor';
import { productImageUrl } from '@/lib/ai/pollinations';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/lib/delivery';

export const metadata = { title: 'Захиалах' };

type SearchParams = { step?: string | string[] };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  // Must be a fully-registered (onboarded) user to check out. Half-registered
  // users — signed in but never finished onboarding — are sent to finish it.
  const user = await requireOnboarded('/checkout');

  const step = parseStep(searchParams.step);

  // Load cart items
  const { data: cart } = await supabase
    .from('cart_items')
    .select('product_id, qty')
    .eq('user_id', user.id);

  if (!cart || cart.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="font-serif italic text-3xl mb-3">Сагс хоосон байна</h1>
        <p className="text-ink/60 mb-8">Цэцэг сонгож сагсандаа нэмнэ үү</p>
        <Link href="/catalog/all" className="btn-primary">
          Цэцэг үзэх →
        </Link>
      </main>
    );
  }

  // Hydrate cart product details for summary
  const productIds = cart.map((c) => c.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, img_url, img_seed, img_prompt')
    .in('id', productIds);

  let subtotal = 0;
  const lines = cart.map((ci) => {
    const p = products?.find((p) => p.id === ci.product_id);
    const line_total = (p?.price ?? 0) * ci.qty;
    subtotal += line_total;
    return { ...ci, product: p, line_total };
  });
  const delivery_fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery_fee;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <nav className="text-[13px] text-ink/60 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">
          Нүүр
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Захиалах</span>
      </nav>

      <h1 className="font-serif italic text-4xl mb-6">Захиалах</h1>

      <CheckoutStepIndicator current={step} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          {step === 'cart' && <CartStep lines={lines} />}
          {step === 'gifts' && <GiftsStep />}
          {step === 'card' && <CardStep />}
          {step === 'pay' && <PayStep userId={user.id} />}
        </div>

        <OrderSummary
          lines={lines}
          subtotal={subtotal}
          delivery_fee={delivery_fee}
          total={total}
          step={step}
        />
      </div>
    </main>
  );
}

// ============================================================
// Step 1 — Cart review
// ============================================================
function CartStep({
  lines,
}: {
  lines: Array<{
    product_id: string;
    qty: number;
    product:
      | {
          id: string;
          name: string;
          price: number;
          img_url: string | null;
          img_seed: number | null;
          img_prompt: string | null;
        }
      | undefined;
    line_total: number;
  }>;
}) {
  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-2xl mb-1">Сагсаа шалгаарай</h2>
        <p className="text-sm text-ink/60">
          Захиалах гэж буй бүтээгдэхүүнээ баталгаажуулна уу
        </p>
      </header>

      <ul className="space-y-3 mb-6">
        {lines.map((l) =>
          l.product ? (
            <li
              key={l.product_id}
              className="bg-white border border-border rounded-card p-4 flex gap-4 items-start"
            >
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg bg-lilac/40 overflow-hidden">
                <Image
                  src={productImageUrl(l.product, 160, 160)}
                  alt={l.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-base leading-snug">
                  {l.product.name}
                </h4>
                <div className="text-xs text-ink/60 mt-0.5">
                  {l.qty} × {l.product.price.toLocaleString()}₮
                </div>
              </div>
              <div className="font-semibold whitespace-nowrap text-sm">
                {l.line_total.toLocaleString()}₮
              </div>
            </li>
          ) : null
        )}
      </ul>

      <div className="flex items-center justify-between">
        <Link
          href="/catalog/all"
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Цааш үзэх
        </Link>
        <Link href="/checkout?step=gifts" className="btn-primary">
          Үргэлжлүүлэх →
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// Step 2 — Gift upsells
// ============================================================
async function GiftsStep() {
  const supabase = createClient();
  const { data: gifts } = await supabase
    .from('products')
    .select('id, name, price, img_url, img_seed, img_prompt')
    .eq('active', true)
    .eq('is_gift_upsell', true)
    .order('price');

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-2xl mb-1">
          Бэлэг нэмэх үү?{' '}
          <span className="text-ink/40 italic text-lg">(сонголтоор)</span>
        </h2>
        <p className="text-sm text-ink/60">
          Цэцэгтэй хамт хүргэх бяцхан гайхшралууд
        </p>
      </header>

      <div className="mb-6">
        <UpsellList
          products={gifts ?? []}
          emptyHint="Одоохондоо санал болгох бэлэг байхгүй байна"
        />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/checkout?step=cart"
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Буцах
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/checkout?step=card"
            className="text-sm text-ink/60 hover:text-ink"
          >
            Алгасах
          </Link>
          <Link href="/checkout?step=card" className="btn-primary">
            Үргэлжлүүлэх →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Step 3 — Card upsell + personal message
// ============================================================
async function CardStep() {
  const supabase = createClient();
  const { data: cards } = await supabase
    .from('products')
    .select('id, name, price, img_url, img_seed, img_prompt')
    .eq('active', true)
    .eq('is_card_upsell', true)
    .order('price');

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-2xl mb-1">
          Card нэмэх үү?{' '}
          <span className="text-ink/40 italic text-lg">(сонголтоор)</span>
        </h2>
        <p className="text-sm text-ink/60">
          Бэлэгтэй хамт хүргэх хувийн мессеж бүхий card
        </p>
      </header>

      <div className="mb-6">
        <UpsellList
          products={cards ?? []}
          emptyHint="Одоохондоо санал болгох card байхгүй байна"
        />
      </div>

      <div className="mb-6">
        <CardMessageEditor />
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/checkout?step=gifts"
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Буцах
        </Link>
        <Link href="/checkout?step=pay" className="btn-primary">
          Төлбөр рүү →
        </Link>
      </div>
    </section>
  );
}

// ============================================================
// Step 4 — Delivery + payment
// ============================================================
async function PayStep({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  return (
    <section>
      <header className="mb-5">
        <h2 className="font-serif text-2xl mb-1">Хүргэлт ба төлбөр</h2>
        <p className="text-sm text-ink/60">
          Захиалга үүсгэх сүүлийн алхам
        </p>
      </header>

      <CheckoutForm addresses={addresses ?? []} />
    </section>
  );
}

// ============================================================
// Right-side summary (always visible)
// ============================================================
function OrderSummary({
  lines,
  subtotal,
  delivery_fee,
  total,
  step,
}: {
  lines: Array<{
    product_id: string;
    qty: number;
    product: { name: string; price: number } | undefined;
    line_total: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  step: CheckoutStep;
}) {
  return (
    <aside className="border border-border rounded-card p-6 h-fit bg-offwhite sticky top-6">
      <h3 className="font-medium mb-4">Захиалгын хураангуй</h3>

      <ul className="divide-y divide-border mb-4 max-h-72 overflow-y-auto">
        {lines.map((l) => (
          <li
            key={l.product_id}
            className="py-3 flex items-start gap-3 text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {l.product?.name ?? l.product_id}
              </div>
              <div className="text-xs text-ink/60 mt-0.5">
                {l.qty} × {l.product?.price.toLocaleString()}₮
              </div>
            </div>
            <div className="font-medium whitespace-nowrap">
              {l.line_total.toLocaleString()}₮
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 text-sm border-t border-border pt-4">
        <div className="flex justify-between">
          <span>Дэд дүн</span>
          <span>{subtotal.toLocaleString()}₮</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>Хүргэлт</span>
          <span>
            {delivery_fee === 0 ? (
              <span className="text-sageDeep font-medium">Үнэгүй</span>
            ) : (
              `${delivery_fee.toLocaleString()}₮`
            )}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
          <span>Нийт</span>
          <span>{total.toLocaleString()}₮</span>
        </div>
      </div>

      {step !== 'pay' && (
        <Link
          href="/checkout?step=pay"
          className="block text-xs text-center text-ink/50 hover:text-ink mt-4"
        >
          Шууд төлбөрлүү алгасах →
        </Link>
      )}
    </aside>
  );
}
