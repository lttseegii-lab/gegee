'use client';

import { type FlowerSelection, type DiyFlower } from '@/lib/diy/flowers';

interface Props {
  flowers: DiyFlower[];
  selections: FlowerSelection[];
  onChange: (selections: FlowerSelection[]) => void;
}

export function StepFlowers({ flowers, selections, onChange }: Props) {
  const map = new Map(selections.map((s) => [s.key, s.qty]));

  function setQty(key: string, qty: number) {
    const clamped = Math.max(0, Math.min(20, qty));
    const filtered = selections.filter((s) => s.key !== key);
    if (clamped > 0) {
      onChange([...filtered, { key, qty: clamped }]);
    } else {
      onChange(filtered);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif italic text-2xl mb-2">1. Цэцгээ сонго</h2>
        <p className="text-sm text-ink/60">
          Тоо хэмжээгээ + / – товчоор тохируулна уу. Хамгийн багадаа нэг цэцэг сонгох
          ёстой.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {flowers.map((f) => {
          const qty = map.get(f.key) ?? 0;
          const active = qty > 0;
          return (
            <div
              key={f.key}
              className={`bg-white rounded-card border p-4 transition-all ${
                active
                  ? 'border-ink shadow-card'
                  : 'border-border hover:border-ink/40'
              }`}
            >
              <div
                className="aspect-square rounded-lg mb-3 flex items-center justify-center text-4xl overflow-hidden"
                style={{ background: f.color + '30' }}
              >
                {f.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.image_url}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  f.emoji
                )}
              </div>
              <div className="font-medium text-sm mb-0.5">{f.name}</div>
              <div className="text-[11px] text-ink/50 mb-3">
                {f.price.toLocaleString()}₮ / ширхэг
              </div>
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => setQty(f.key, qty - 1)}
                  disabled={qty === 0}
                  aria-label="Багасгах"
                  className="w-8 h-8 rounded-full border border-border hover:bg-offwhite disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-9 text-center text-sm font-medium">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(f.key, qty + 1)}
                  disabled={qty >= 20}
                  aria-label="Нэмэх"
                  className="w-8 h-8 rounded-full bg-ink text-white hover:bg-pinkHot disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
