-- ============================================================
-- Gegeen Phase 3 — Delivery slot + Trust layer
-- ============================================================
-- 1. Delivery scheduling on orders:
--    delivery_date  — calendar date the customer wants the bouquet to arrive
--    delivery_slot  — '10-13' | '14-17' | '18-21' | 'asap' time window
--    is_surprise    — gift mode: don't pre-notify recipient
-- 2. Trust photos uploaded by florist team during fulfillment:
--    prep_photo_url     — bouquet ready to ship
--    delivery_photo_url — handed over / arrived

alter table public.orders
  add column if not exists delivery_date  date,
  add column if not exists delivery_slot  text
    check (delivery_slot is null or delivery_slot in ('10-13','14-17','18-21','asap')),
  add column if not exists is_surprise    boolean not null default false,
  add column if not exists prep_photo_url     text,
  add column if not exists delivery_photo_url text,
  add column if not exists recipient_phone text;

-- Index for admin "today's deliveries" dashboard
create index if not exists idx_orders_delivery_date
  on public.orders(delivery_date)
  where delivery_date is not null;

-- Convenience: a Postgres function that lists today's outstanding deliveries
-- for the admin dispatch view. Wrapped in security definer so it can read
-- across rows regardless of which admin is calling.
create or replace function public.todays_deliveries()
returns table (
  id              bigint,
  order_code      text,
  customer_name   text,
  recipient_phone text,
  delivery_slot   text,
  total           integer,
  status          order_status,
  is_surprise     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.order_code,
    p.name as customer_name,
    o.recipient_phone,
    o.delivery_slot,
    o.total,
    o.status,
    o.is_surprise
  from public.orders o
  left join public.profiles p on p.id = o.user_id
  where o.delivery_date = current_date
    and o.status in ('paid','preparing','shipped')
  order by
    case o.delivery_slot
      when 'asap'  then 0
      when '10-13' then 1
      when '14-17' then 2
      when '18-21' then 3
      else 4
    end,
    o.id;
$$;

grant execute on function public.todays_deliveries() to authenticated;
