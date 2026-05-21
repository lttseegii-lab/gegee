import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusUpdater } from '@/components/admin/StatusUpdater';
import { productImageUrl } from '@/lib/ai/pollinations';
import type { OrderStatus } from '@/types/database';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Төлбөр хүлээж буй',
  paid: 'Төлсөн',
  preparing: 'Бэлдэж буй',
  shipped: 'Хүргэлтэнд гарсан',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцалсан',
  refunded: 'Буцаасан',
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-pale text-goldDeep',
  paid: 'bg-mint text-sageDeep',
  preparing: 'bg-blush text-pinkHot',
  shipped: 'bg-purpleSoft text-ink',
  delivered: 'bg-mint text-sageDeep',
  cancelled: 'bg-offwhite text-ink/50',
  refunded: 'bg-offwhite text-ink/50',
};

export default async function AdminOrderDetail({
  params,
}: {
  params: { id: string };
}) {
  const orderId = parseInt(params.id, 10);
  if (isNaN(orderId)) notFound();

  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (!order) notFound();

  const [
    { data: items },
    { data: address },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('order_items')
      .select('product_id, qty, unit_price')
      .eq('order_id', orderId),
    order.address_id
      ? supabase
          .from('addresses')
          .select('*')
          .eq('id', order.address_id)
          .single()
      : Promise.resolve({ data: null }),
    order.user_id
      ? supabase
          .from('profiles')
          .select('id, name, email, phone')
          .eq('id', order.user_id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  // Hydrate item products
  const productIds = (items ?? []).map((i) => i.product_id);
  const { data: products } = productIds.length
    ? await supabase.from('products').select('*').in('id', productIds)
    : { data: [] };

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  return (
    <div className="p-8 max-w-6xl">
      <nav className="text-[13px] text-ink/60 mb-4 flex items-center gap-2">
        <Link href="/admin" className="hover:text-ink">Admin</Link>
        <span className="text-ink/30">›</span>
        <Link href="/admin/orders" className="hover:text-ink">Захиалга</Link>
        <span className="text-ink/30">›</span>
        <span className="text-ink font-medium font-mono">{order.order_code}</span>
      </nav>

      <header className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif italic text-3xl">
            {order.order_code}
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            {order.created_at
              ? new Date(order.created_at).toLocaleString('mn-MN', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })
              : '—'}
          </p>
        </div>
        <div>
          <span
            className={`text-[11px] uppercase tracking-wider px-3 py-1 rounded-full ${
              STATUS_COLOR[order.status ?? ''] ?? 'bg-offwhite text-ink/60'
            }`}
          >
            {STATUS_LABEL[order.status ?? ''] ?? order.status}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Left: items + address */}
        <div className="space-y-6">
          {/* Items */}
          <section className="bg-white border border-border rounded-card overflow-hidden">
            <h2 className="font-medium px-6 py-4 border-b border-border bg-offwhite">
              Бүтээгдэхүүн ({items?.length ?? 0})
            </h2>
            <ul className="divide-y divide-border">
              {(items ?? []).map((it) => {
                const p = productMap.get(it.product_id);
                return (
                  <li key={it.product_id} className="flex items-center gap-4 p-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded bg-lilac/40 overflow-hidden">
                      {p && (
                        <Image
                          src={productImageUrl(p, 200, 200)}
                          alt={p.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {p?.name ?? it.product_id}
                      </div>
                      <div className="text-xs text-ink/60 mt-0.5">
                        {it.qty} × {it.unit_price.toLocaleString()}₮
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {(it.qty * it.unit_price).toLocaleString()}₮
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="px-6 py-4 border-t border-border bg-offwhite space-y-1 text-sm">
              <div className="flex justify-between text-ink/70">
                <span>Дэд дүн</span>
                <span>{order.subtotal.toLocaleString()}₮</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Хүргэлт</span>
                <span>
                  {(order.delivery_fee ?? 0) === 0
                    ? 'Үнэгүй'
                    : `${(order.delivery_fee ?? 0).toLocaleString()}₮`}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2 mt-2">
                <span>Нийт</span>
                <span>{order.total.toLocaleString()}₮</span>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white border border-border rounded-card p-6">
            <h2 className="font-medium mb-3">Хүргэлтийн хаяг</h2>
            {address ? (
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {address.recipient} · {address.phone}
                </div>
                <div className="text-ink/70">
                  {[address.city, address.district, address.khoroo, address.building]
                    .filter(Boolean)
                    .join(', ')}
                </div>
                {(address.entrance || address.floor || address.unit) && (
                  <div className="text-ink/70">
                    {[
                      address.entrance && `${address.entrance} орц`,
                      address.floor && `${address.floor} давхар`,
                      address.unit && `${address.unit} тоот`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {address.notes && (
                  <div className="text-xs text-ink/50 italic mt-2">
                    “{address.notes}”
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/50">Хаяг бүртгэгдээгүй</p>
            )}
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[11px] uppercase tracking-wider text-ink/40 mb-1">
                  Захиалгын тэмдэглэл
                </div>
                <div className="text-sm">{order.notes}</div>
              </div>
            )}
          </section>
        </div>

        {/* Right: status + customer + QPay info */}
        <aside className="space-y-6">
          <section className="bg-white border border-border rounded-card p-5">
            <h2 className="font-medium mb-4">Status шилжүүлэх</h2>
            <StatusUpdater
              orderId={order.id}
              currentStatus={(order.status ?? 'pending_payment') as OrderStatus}
            />
          </section>

          {profile && (
            <section className="bg-white border border-border rounded-card p-5">
              <h2 className="font-medium mb-3">Хэрэглэгч</h2>
              <Link
                href={`/admin/customers/${profile.id}`}
                className="text-sm text-ink hover:text-pinkHot block"
              >
                {profile.name ?? '(нэргүй)'}
              </Link>
              <div className="text-xs text-ink/60 mt-1">{profile.email}</div>
              {profile.phone && (
                <div className="text-xs text-ink/60">{profile.phone}</div>
              )}
            </section>
          )}

          {(order.qpay_invoice_id || order.qpay_payment_id) && (
            <section className="bg-white border border-border rounded-card p-5 text-xs">
              <h2 className="font-medium text-sm mb-3">QPay</h2>
              {order.qpay_invoice_id && (
                <div>
                  <div className="text-ink/40 uppercase text-[10px] mb-0.5">
                    Invoice ID
                  </div>
                  <div className="font-mono text-ink/80 break-all">
                    {order.qpay_invoice_id}
                  </div>
                </div>
              )}
              {order.qpay_payment_id && (
                <div className="mt-3">
                  <div className="text-ink/40 uppercase text-[10px] mb-0.5">
                    Payment ID
                  </div>
                  <div className="font-mono text-ink/80 break-all">
                    {order.qpay_payment_id}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="bg-white border border-border rounded-card p-5 text-xs space-y-2">
            <h2 className="font-medium text-sm mb-2">Timestamps</h2>
            <div>
              <span className="text-ink/40">Created:</span>{' '}
              {order.created_at
                ? new Date(order.created_at).toLocaleString('mn-MN')
                : '—'}
            </div>
            {order.paid_at && (
              <div>
                <span className="text-ink/40">Paid:</span>{' '}
                {new Date(order.paid_at).toLocaleString('mn-MN')}
              </div>
            )}
            {order.delivered_at && (
              <div>
                <span className="text-ink/40">Delivered:</span>{' '}
                {new Date(order.delivered_at).toLocaleString('mn-MN')}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
