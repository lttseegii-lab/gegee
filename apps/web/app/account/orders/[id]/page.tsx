import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { signOrderPhoto } from '@/lib/storage/orderPhotos';

export const metadata = { title: 'Захиалгын дэлгэрэнгүй' };

const SLOT_LABEL: Record<string, string> = {
  asap: 'Хамгийн хурдан (90 минутын дотор)',
  '10-13': 'Өглөө 10:00–13:00',
  '14-17': 'Үд 14:00–17:00',
  '18-21': 'Орой 18:00–21:00',
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/account/orders');

  const orderId = parseInt(params.id, 10);
  if (isNaN(orderId)) notFound();

  const [
    { data: order },
    { data: items },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('order_items')
      .select('product_id, qty, unit_price')
      .eq('order_id', orderId),
  ]);

  if (!order) notFound();

  // Order photos live in a private bucket — mint short-lived signed URLs now
  // that ownership is verified (the query above filters by user_id).
  const [prepPhoto, deliveryPhoto] = await Promise.all([
    signOrderPhoto(order.prep_photo_url),
    signOrderPhoto(order.delivery_photo_url),
  ]);

  // Fetch product names for line items
  const productIds = (items ?? []).map((i) => i.product_id);
  const { data: products } = productIds.length
    ? await supabase
        .from('products')
        .select('id, name, img_url, img_seed, img_prompt')
        .in('id', productIds)
    : { data: [] };
  const productsMap = new Map((products ?? []).map((p) => [p.id, p]));

  // Address (if linked)
  const { data: address } = order.address_id
    ? await supabase
        .from('addresses')
        .select('*')
        .eq('id', order.address_id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/account/orders" className="hover:text-ink">
          Захиалга
        </Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium font-mono">{order.order_code}</span>
      </nav>

      <header className="mb-8 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif italic text-3xl">{order.order_code}</h1>
          <div className="text-sm text-ink/60 mt-1">
            {order.created_at &&
              new Date(order.created_at).toLocaleDateString('mn-MN', {
                dateStyle: 'long',
              })}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-ink/40">
            Нийт
          </div>
          <div className="text-2xl font-serif italic">
            {order.total.toLocaleString()}₮
          </div>
        </div>
      </header>

      {/* Resume payment for an unpaid order */}
      {order.status === 'pending_payment' && (
        <div className="mb-8 bg-yellow-pale border border-goldDeep/30 rounded-card p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-ink/80">
            Энэ захиалгын төлбөр хүлээгдэж байна.
          </div>
          <Link
            href={`/checkout/payment?orderId=${order.id}`}
            className="btn-primary shrink-0"
          >
            Төлбөр төлөх →
          </Link>
        </div>
      )}

      {/* Status timeline */}
      <section className="mb-10">
        <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-4">
          Захиалгын явц
        </h2>
        <div className="bg-white border border-border rounded-card p-6">
          <OrderTimeline
            status={order.status}
            paidAt={order.paid_at}
            deliveredAt={order.delivered_at}
            createdAt={order.created_at}
            prepPhotoUrl={prepPhoto}
            deliveryPhotoUrl={deliveryPhoto}
          />
        </div>
      </section>

      {/* Delivery details */}
      {(order.delivery_date || order.delivery_slot) && (
        <section className="mb-10">
          <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-4">
            Хүргэлт
          </h2>
          <div className="bg-white border border-border rounded-card p-5 space-y-2 text-sm">
            {order.delivery_date && (
              <div className="flex justify-between">
                <span className="text-ink/60">Өдөр</span>
                <span className="font-medium">
                  {new Date(order.delivery_date).toLocaleDateString('mn-MN', {
                    dateStyle: 'long',
                  })}
                </span>
              </div>
            )}
            {order.delivery_slot && (
              <div className="flex justify-between">
                <span className="text-ink/60">Цаг</span>
                <span className="font-medium">
                  {SLOT_LABEL[order.delivery_slot] ?? order.delivery_slot}
                </span>
              </div>
            )}
            {order.recipient_phone && (
              <div className="flex justify-between">
                <span className="text-ink/60">Хүлээн авагч</span>
                <span className="font-medium">{order.recipient_phone}</span>
              </div>
            )}
            {order.is_surprise && (
              <div className="text-xs text-pinkHot italic mt-2">
                🎁 Нууц бэлэг — урьдчилан мэдэгдээгүй
              </div>
            )}
          </div>
        </section>
      )}

      {/* Address */}
      {address && (
        <section className="mb-10">
          <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-4">
            Хаяг
          </h2>
          <div className="bg-white border border-border rounded-card p-5 text-sm">
            <div className="font-medium">{address.recipient}</div>
            <div className="text-ink/70">{address.phone}</div>
            <div className="text-ink/60 mt-2">
              {[address.city, address.district, address.khoroo, address.building]
                .filter(Boolean)
                .join(', ')}
            </div>
            {(address.entrance || address.floor || address.unit) && (
              <div className="text-ink/60">
                {[
                  address.entrance && `${address.entrance} орц`,
                  address.floor && `${address.floor} давхар`,
                  address.unit && `${address.unit} тоот`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Card message */}
      {order.card_message && (
        <section className="mb-10">
          <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-4">
            Картын мессеж
          </h2>
          <div className="bg-blush rounded-card p-5 italic text-ink/80">
            “{order.card_message}”
          </div>
        </section>
      )}

      {/* Items */}
      <section>
        <h2 className="font-medium text-sm uppercase tracking-wider text-ink/50 mb-4">
          Бүтээгдэхүүн
        </h2>
        <ul className="bg-white border border-border rounded-card overflow-hidden divide-y divide-border">
          {(items ?? []).map((it) => {
            const p = productsMap.get(it.product_id);
            return (
              <li
                key={it.product_id}
                className="flex items-center gap-4 p-4 text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{p?.name ?? it.product_id}</div>
                  <div className="text-xs text-ink/50">
                    {it.qty} × {it.unit_price.toLocaleString()}₮
                  </div>
                </div>
                <div className="font-semibold">
                  {(it.qty * it.unit_price).toLocaleString()}₮
                </div>
              </li>
            );
          })}
          <li className="p-4 text-sm flex justify-between bg-offwhite">
            <span className="text-ink/60">Хүргэлт</span>
            <span>
              {order.delivery_fee === 0 || order.delivery_fee == null
                ? 'Үнэгүй'
                : `${order.delivery_fee.toLocaleString()}₮`}
            </span>
          </li>
          <li className="p-4 flex justify-between font-semibold bg-offwhite">
            <span>Нийт</span>
            <span>{order.total.toLocaleString()}₮</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
