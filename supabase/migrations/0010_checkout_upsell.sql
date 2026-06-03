-- ============================================================
-- Gegeen Phase 2 — Multi-step checkout (gift + card upsells)
-- ============================================================
-- Admin flags products for inclusion in checkout funnel:
--   - is_gift_upsell  → shown on /checkout?step=gifts
--   - is_card_upsell  → shown on /checkout?step=card
--
-- orders.card_message stores the personal note written for the
-- greeting card during checkout step 3.

alter table public.products
  add column if not exists is_gift_upsell boolean not null default false,
  add column if not exists is_card_upsell boolean not null default false;

create index if not exists idx_products_gift_upsell
  on public.products(is_gift_upsell)
  where is_gift_upsell and active;

create index if not exists idx_products_card_upsell
  on public.products(is_card_upsell)
  where is_card_upsell and active;

alter table public.orders
  add column if not exists card_message text;
