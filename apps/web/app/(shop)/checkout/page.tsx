import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/stores/cartStore';

export const metadata = { title: 'Захиалах' };

export default async function CheckoutPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/checkout');

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

  const productIds = cart.map((c) => c.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, img_url, img_seed, img_prompt')
    .in('id', productIds);

  // Calculate totals
  let subtotal = 0;
  const lines = cart.map((ci) => {
    const p = products?.find((p) => p.id === ci.product_id);
    const line_total = (p?.price ?? 0) * ci.qty;
    subtotal += line_total;
    return { ...ci, product: p, line_total };
  });
  const delivery_fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery_fee;

  // Load addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <nav className="text-[13px] text-ink/60 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Нүүр</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium">Захиалах</span>
      </nav>

      <h1 className="font-serif italic text-4xl mb-8">Захиалах</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        {/* Left — address selection + notes form */}
        <CheckoutForm addresses={addresses ?? []} />

        {/* Right — order summary */}
        <aside className="border border-border rounded-card p-6 h-fit bg-offwhite">
          <h3 className="font-medium mb-4">Захиалгын хураангуй</h3>

          <ul className="divide-y divide-border mb-4">
            {lines.map((l) => (
              <li key={l.product_id} className="py-3 flex items-start gap-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{l.product?.name ?? l.product_id}</div>
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
        </aside>
      </div>
    </main>
  );
}
