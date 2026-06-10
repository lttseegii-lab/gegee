import { describe, it, expect } from 'vitest';
import { calculatePrice, flowerSubtotal } from './pricing';
import type { DiyFlower, FlowerSelection } from './flowers';
import type { DiyWrap } from './wraps';

const flowers: Record<string, DiyFlower> = {
  rose: { price: 30_000 } as unknown as DiyFlower,
  tulip: { price: 10_000 } as unknown as DiyFlower,
};
const wraps: Record<string, DiyWrap> = {
  kraft: { price: 5_000 } as unknown as DiyWrap,
};

const sel = (arr: { key: string; qty: number }[]) =>
  arr as unknown as FlowerSelection[];

describe('flowerSubtotal', () => {
  it('sums price × qty and ignores unknown keys', () => {
    expect(
      flowerSubtotal(
        sel([
          { key: 'rose', qty: 2 },
          { key: 'tulip', qty: 3 },
          { key: 'ghost', qty: 5 },
        ]),
        flowers
      )
    ).toBe(2 * 30_000 + 3 * 10_000);
  });
});

describe('calculatePrice', () => {
  it('applies the 30% markup and rounds to the nearest 1000', () => {
    const r = calculatePrice(sel([{ key: 'rose', qty: 2 }]), 'kraft', flowers, wraps);
    expect(r.subtotal).toBe(60_000);
    expect(r.wrap).toBe(5_000);
    // (60000 + 5000) * 1.3 = 84500 → nearest 1000 = 85000
    expect(r.total).toBe(85_000);
    expect(r.markup).toBe(r.total - r.subtotal - r.wrap);
  });

  it('enforces the 50K minimum for a non-empty bouquet', () => {
    // (10000) * 1.3 = 13000 < 50000
    const r = calculatePrice(sel([{ key: 'tulip', qty: 1 }]), null, flowers, wraps);
    expect(r.total).toBe(50_000);
  });

  it('is zero for an empty selection (no min applied)', () => {
    const r = calculatePrice([], null, flowers, wraps);
    expect(r.subtotal).toBe(0);
    expect(r.total).toBe(0);
  });
});
