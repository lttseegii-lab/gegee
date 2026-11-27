import type { TaobaoPricing } from './types';

/** Placeholders until the admin enters real numbers. */
export const DEFAULT_TAOBAO_PRICING: TaobaoPricing = {
  cnyRate: 500,
  marginPercent: 30,
  cargoFee: 3000,
};

const LIMITS: Record<keyof TaobaoPricing, [number, number]> = {
  cnyRate: [1, 100_000],
  marginPercent: [0, 1000],
  cargoFee: [0, 1_000_000],
};

function intWithin(value: unknown, [min, max]: [number, number]): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : null;
}

/** Strict: returns null when any field is missing or out of range. */
export function parsePricing(input: unknown): TaobaoPricing | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const cnyRate = intWithin(raw.cnyRate, LIMITS.cnyRate);
  const marginPercent = intWithin(raw.marginPercent, LIMITS.marginPercent);
  const cargoFee = intWithin(raw.cargoFee, LIMITS.cargoFee);
  if (cnyRate == null || marginPercent == null || cargoFee == null) return null;
  return { cnyRate, marginPercent, cargoFee };
}

/**
 * cost  = CNY price × rate + cargo
 * price = cost + margin, rounded up to the next 100₮
 */
export function taobaoPrice(priceCny: number, pricing: TaobaoPricing): { cost: number; price: number } {
  const cost = Math.round(priceCny * pricing.cnyRate + pricing.cargoFee);
  const price = Math.ceil((cost * (1 + pricing.marginPercent / 100)) / 100) * 100;
  return { cost, price };
}
