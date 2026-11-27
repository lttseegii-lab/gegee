import { describe, it, expect } from 'vitest';
import { DEFAULT_TAOBAO_PRICING, parsePricing, taobaoPrice } from './pricing';

describe('taobaoPrice', () => {
  it('adds cargo to the converted price, then margin, rounded up to 100₮', () => {
    expect(taobaoPrice(268, DEFAULT_TAOBAO_PRICING)).toEqual({ cost: 137000, price: 178100 });
    expect(taobaoPrice(49, { cnyRate: 480, marginPercent: 25, cargoFee: 5000 })).toEqual({ cost: 28520, price: 35700 });
  });
  it('never prices below cost when margin is zero', () => {
    const { cost, price } = taobaoPrice(19.9, { cnyRate: 497, marginPercent: 0, cargoFee: 0 });
    expect(price).toBeGreaterThanOrEqual(cost);
    expect(price % 100).toBe(0);
  });
});

describe('parsePricing', () => {
  it('accepts whole numbers in range, as numbers or numeric strings', () => {
    expect(parsePricing({ cnyRate: 480, marginPercent: 25, cargoFee: 5000 })).toEqual({ cnyRate: 480, marginPercent: 25, cargoFee: 5000 });
    expect(parsePricing({ cnyRate: '480', marginPercent: '0', cargoFee: '0' })).toEqual({ cnyRate: 480, marginPercent: 0, cargoFee: 0 });
  });
  it('rejects missing, fractional, out-of-range or non-object input', () => {
    expect(parsePricing(null)).toBeNull();
    expect(parsePricing({ cnyRate: 0, marginPercent: 25, cargoFee: 0 })).toBeNull();
    expect(parsePricing({ cnyRate: 480.5, marginPercent: 25, cargoFee: 0 })).toBeNull();
    expect(parsePricing({ cnyRate: 480, marginPercent: -1, cargoFee: 0 })).toBeNull();
    expect(parsePricing({ cnyRate: 480, marginPercent: 25 })).toBeNull();
    expect(parsePricing({ cnyRate: NaN, marginPercent: 25, cargoFee: 0 })).toBeNull();
  });
});
