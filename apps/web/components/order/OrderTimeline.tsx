import Image from 'next/image';
import type { OrderStatus } from '@/types/database';

interface Props {
  status: OrderStatus | null;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  prepPhotoUrl?: string | null;
  deliveryPhotoUrl?: string | null;
}

const STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending_payment', label: 'Төлбөр хүлээж байна',  icon: '💳' },
  { key: 'paid',             label: 'Төлбөр төлөгдсөн',     icon: '✅' },
  { key: 'preparing',        label: 'Florist баглааг бэлдэж байна', icon: '🌸' },
  { key: 'shipped',          label: 'Хүргэлтэнд гарсан',    icon: '🚴' },
  { key: 'delivered',        label: 'Хүргэгдсэн',           icon: '🎁' },
];

const STATUS_ORDER: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  preparing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
};

function fmt(d: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('mn-MN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

export function OrderTimeline({
  status,
  paidAt,
  deliveredAt,
  createdAt,
  prepPhotoUrl,
  deliveryPhotoUrl,
}: Props) {
  const currentIdx = STATUS_ORDER[status ?? 'pending_payment'] ?? 0;
  const isCancelled = status === 'cancelled' || status === 'refunded';

  if (isCancelled) {
    return (
      <div className="bg-blush border border-pinkHot/30 rounded-card p-5">
        <div className="text-pinkHot font-medium">
          ⚠ {status === 'cancelled' ? 'Цуцлагдсан' : 'Буцаан төлөгдсөн'}
        </div>
        <div className="text-xs text-ink/60 mt-1">
          Танай захиалга {status === 'cancelled' ? 'цуцлагдсан' : 'буцаан төлөгдсөн'} байна. Дэлгэрэнгүйг бидэнтэй холбогдоно уу.
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="space-y-4">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          let timestamp = '';
          if (step.key === 'pending_payment') timestamp = fmt(createdAt);
          if (step.key === 'paid') timestamp = fmt(paidAt);
          if (step.key === 'delivered') timestamp = fmt(deliveredAt);

          return (
            <li key={step.key} className="flex gap-4">
              {/* Indicator column */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                    done
                      ? isCurrent
                        ? 'bg-pinkHot text-white ring-4 ring-pinkHot/20'
                        : 'bg-sageDeep text-white'
                      : 'bg-offwhite text-ink/30 border border-border'
                  }`}
                >
                  {done && !isCurrent ? '✓' : step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-px flex-1 mt-1.5 ${
                      done && i < currentIdx ? 'bg-sageDeep' : 'bg-border'
                    }`}
                    style={{ minHeight: '24px' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div
                  className={`font-medium ${
                    done ? 'text-ink' : 'text-ink/40'
                  }`}
                >
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-pinkHot text-white px-2 py-0.5 rounded">
                      Одоо
                    </span>
                  )}
                </div>
                {timestamp && (
                  <div className="text-xs text-ink/50 mt-1">{timestamp}</div>
                )}

                {/* Photo proof per step */}
                {step.key === 'preparing' && prepPhotoUrl && (
                  <PhotoCard
                    src={prepPhotoUrl}
                    label="Баглаа бэлэн болсон зураг"
                  />
                )}
                {step.key === 'delivered' && deliveryPhotoUrl && (
                  <PhotoCard
                    src={deliveryPhotoUrl}
                    label="Хүргэсэн зураг"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PhotoCard({ src, label }: { src: string; label: string }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-block group"
    >
      <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden bg-lilac/40 group-hover:ring-2 group-hover:ring-ink/20 transition-shadow">
        <Image
          src={src}
          alt={label}
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>
      <div className="text-xs text-ink/50 mt-1.5">{label} →</div>
    </a>
  );
}
