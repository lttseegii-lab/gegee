-- ============================================================
-- Gegeen Phase 2 — Link orders to Memory Garden events
-- ============================================================
-- A user can tag an order to a specific memory_date entry (e.g.
-- "this delivery is for Ээж's birthday"). This lets the Memory
-- Garden card surface the actual delivery history for each event
-- instead of an auto-generated AI suggestion.

alter table public.orders
  add column if not exists memory_date_id bigint
  references public.memory_dates(id) on delete set null;

-- Index for the lookup "all orders linked to a given memory_date_id"
create index if not exists idx_orders_memory_date
  on public.orders(memory_date_id)
  where memory_date_id is not null;

-- ───── RLS already covers this — owner_select/owner_insert policies
-- on public.orders apply equally to rows with a memory_date_id.
