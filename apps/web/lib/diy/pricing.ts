// DIY bouquet pricing — combines flower stems + wrap + atelier markup.
// Catalog lookups are passed in (admin-managed), not imported statically.

import { type FlowerSelection, type DiyFlower } from './flowers';
import { type DiyWrap } from './wraps';

const ATELIER_MARKUP = 1.3; // 30% labor markup over materials
const MIN_PRICE = 50_000;   // Don't sell below 50K₮
const PRICE_ROUND = 1000;   // Round final price to nearest 1000₮

export function flowerSubtotal(
  selections: FlowerSelection[],
  flowersByKey: Record<string, DiyFlower>
): number {
  return selections.reduce((sum, s) => {
    const f = flowersByKey[s.key];
    return sum + (f ? f.price * s.qty : 0);
  }, 0);
}

export function calculatePrice(
  selections: FlowerSelection[],
  wrapKey: string | null,
  flowersByKey: Record<string, DiyFlower>,
  wrapsByKey: Record<string, DiyWrap>
): { subtotal: number; wrap: number; markup: number; total: number } {
  const subtotal = flowerSubtotal(selections, flowersByKey);
  const wrap = wrapKey ? wrapsByKey[wrapKey]?.price ?? 0 : 0;
  const baseTotal = (subtotal + wrap) * ATELIER_MARKUP;
  const roundedTotal = Math.round(baseTotal / PRICE_ROUND) * PRICE_ROUND;
  const total = Math.max(roundedTotal, subtotal === 0 ? 0 : MIN_PRICE);
  return {
    subtotal,
    wrap,
    markup: total - subtotal - wrap,
    total,
  };
}
