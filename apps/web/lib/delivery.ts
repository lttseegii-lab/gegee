// Delivery pricing constants + helper.
//
// IMPORTANT: this is a plain module (NOT 'use client'). These values are
// imported by Server Components and Server Actions (checkout). When they lived
// in the 'use client' cartStore, importing them on the server turned each
// export into a client-reference proxy ({}), so `delivery_fee` became `{}` —
// breaking the order total and the order INSERT ("invalid input syntax for
// type integer: '{}'").

export const FREE_DELIVERY_THRESHOLD = 100_000;
export const DELIVERY_FEE = 8_000;

export function calcDelivery(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
