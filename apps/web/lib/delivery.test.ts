import { describe, it, expect } from 'vitest';
import { calcDelivery, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from './delivery';

describe('calcDelivery', () => {
  it('charges the flat fee below the free-delivery threshold', () => {
    expect(calcDelivery(0)).toBe(DELIVERY_FEE);
    expect(calcDelivery(FREE_DELIVERY_THRESHOLD - 1)).toBe(DELIVERY_FEE);
  });

  it('is free at or above the threshold', () => {
    expect(calcDelivery(FREE_DELIVERY_THRESHOLD)).toBe(0);
    expect(calcDelivery(FREE_DELIVERY_THRESHOLD + 50_000)).toBe(0);
  });

  it('matches the constants the SQL order RPC hardcodes', () => {
    expect(FREE_DELIVERY_THRESHOLD).toBe(100_000);
    expect(DELIVERY_FEE).toBe(8_000);
  });
});
