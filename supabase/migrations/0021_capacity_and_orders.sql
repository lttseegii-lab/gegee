-- ============================================================
-- 0021 — Capacity model + server-authoritative order creation
-- ============================================================
-- Idempotent. Covers audit findings:
--   1B  arbitrary-total order insert (client bypassed the server action)
--   2C  delivery capacity reserved but never released (counter drift / leak)
--   3C  delivery date/slot not validated server-side
--   (also makes order creation atomic — fixes the non-transactional path)
-- ============================================================


-- ───────────────────────────────────────────────────────────
-- 2C. Capacity becomes DERIVED from orders instead of a hand-maintained
--     increment/decrement counter (which only ever went up → days falsely
--     showed "full"). A trigger recomputes daily_capacity.current_orders from
--     the live orders for that date, so cancel/refund/expiry self-heal it.
-- ───────────────────────────────────────────────────────────

-- Statuses that occupy a delivery slot. Abandoned pending_payment orders are
-- swept to 'cancelled' by expire_stale_pending_orders(), which removes them.
create or replace function public.recompute_capacity(target_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_date is null then
    return;
  end if;
  insert into public.daily_capacity(date) values (target_date)
    on conflict (date) do nothing;
  update public.daily_capacity dc
    set current_orders = (
      select count(*)
      from public.orders o
      where o.delivery_date = target_date
        and o.status in ('pending_payment','paid','preparing','shipped','delivered')
    )
    where dc.date = target_date;
end;
$$;

create or replace function public.sync_capacity_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recompute_capacity(new.delivery_date);
  elsif tg_op = 'DELETE' then
    perform public.recompute_capacity(old.delivery_date);
    return old;
  else -- UPDATE
    perform public.recompute_capacity(new.delivery_date);
    if old.delivery_date is distinct from new.delivery_date then
      perform public.recompute_capacity(old.delivery_date);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_capacity on public.orders;
create trigger trg_sync_capacity
  after insert or update or delete on public.orders
  for each row execute function public.sync_capacity_on_order();

-- Sweep abandoned pending_payment orders so they stop holding a slot. The
-- status change fires trg_sync_capacity which frees the capacity. Called
-- opportunistically from create_order_from_cart; can also be scheduled via
-- pg_cron (select cron.schedule(...)) if the extension is enabled.
create or replace function public.expire_stale_pending_orders(
  ttl interval default interval '15 minutes'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with expired as (
    update public.orders
      set status = 'cancelled'
      where status = 'pending_payment'
        and created_at < now() - ttl
      returning 1
  )
  select count(*) into n from expired;
  return n;
end;
$$;

-- One-time backfill so existing rows match the new derived model.
update public.daily_capacity dc
  set current_orders = (
    select count(*)
    from public.orders o
    where o.delivery_date = dc.date
      and o.status in ('pending_payment','paid','preparing','shipped','delivered')
  );

-- These were directly callable by any authenticated user (could desync counts /
-- DoS the booking calendar). Capacity is now internal-only (RPC + triggers).
revoke execute on function public.try_reserve_capacity(date) from authenticated;
revoke execute on function public.release_capacity(date) from authenticated;
revoke execute on function public.expire_stale_pending_orders(interval) from anon, authenticated;


-- ───────────────────────────────────────────────────────────
-- 1B. Order creation moves into a SECURITY DEFINER RPC. The client can no
--     longer insert an order with an attacker-chosen total: totals are
--     recomputed from cart_items × live product prices, the delivery date/slot
--     is validated, capacity is enforced under a row lock, and order + items +
--     cart-clear happen in ONE transaction. Direct INSERT is revoked below.
-- ───────────────────────────────────────────────────────────
create or replace function public.create_order_from_cart(
  p_address_id  bigint,
  p_notes       text  default null,
  p_card_message text default null,
  p_delivery    jsonb default null
)
returns table (order_id bigint, order_code text, total integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid             uuid := auth.uid();
  v_today           date := (now() at time zone 'Asia/Ulaanbaatar')::date;
  v_delivery_date   date;
  v_slot            text;
  v_is_surprise     boolean;
  v_recipient_phone text;
  v_subtotal        integer;
  v_delivery_fee    integer;
  v_total           integer;
  v_order_id        bigint;
  v_order_code      text;
  v_cap             public.daily_capacity%rowtype;
  -- Money constants — MUST stay in sync with apps/web/lib/delivery.ts
  c_free_threshold  constant integer := 100000;
  c_delivery_fee    constant integer := 8000;
  c_max_days        constant integer := 6;   -- picker offers today .. today+6
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Address must belong to the caller.
  if not exists (
    select 1 from public.addresses where id = p_address_id and user_id = v_uid
  ) then
    raise exception 'Address not found';
  end if;

  -- Delivery payload (server-validated).
  v_delivery_date   := coalesce((p_delivery->>'date')::date, v_today);
  v_slot            := p_delivery->>'slot';
  v_is_surprise     := coalesce((p_delivery->>'is_surprise')::boolean, false);
  v_recipient_phone := nullif(btrim(coalesce(p_delivery->>'recipient_phone','')), '');

  if v_delivery_date < v_today or v_delivery_date > v_today + c_max_days then
    raise exception 'Invalid delivery date';
  end if;
  if v_slot is not null and v_slot not in ('asap','10-13','14-17','18-21') then
    raise exception 'Invalid delivery slot';
  end if;
  if v_slot = 'asap' and v_delivery_date <> v_today then
    raise exception 'Invalid delivery slot';   -- ASAP only available today
  end if;

  -- Cart must be non-empty and every product still active.
  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'Cart is empty';
  end if;
  if exists (
    select 1
    from public.cart_items ci
    left join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid and (p.id is null or p.active = false)
  ) then
    raise exception 'A product is no longer available';
  end if;

  -- Server-authoritative totals.
  select coalesce(sum(p.price * ci.qty), 0)::integer
    into v_subtotal
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid;

  if v_subtotal <= 0 then
    raise exception 'Invalid cart total';
  end if;

  v_delivery_fee := case when v_subtotal >= c_free_threshold then 0 else c_delivery_fee end;
  v_total        := v_subtotal + v_delivery_fee;

  -- Capacity: free abandoned holds, then enforce the cap under a row lock so
  -- concurrent checkouts on the same day can't overbook.
  perform public.expire_stale_pending_orders();
  insert into public.daily_capacity(date) values (v_delivery_date)
    on conflict (date) do nothing;
  select * into v_cap from public.daily_capacity where date = v_delivery_date for update;
  if v_cap.closed then
    raise exception 'CAPACITY_CLOSED';
  end if;
  if v_cap.current_orders >= v_cap.max_orders then
    raise exception 'CAPACITY_FULL';
  end if;

  -- Insert order (trg_sync_capacity recomputes current_orders).
  insert into public.orders (
    user_id, address_id, subtotal, delivery_fee, total, notes, card_message,
    status, delivery_date, delivery_slot, is_surprise, recipient_phone
  ) values (
    v_uid, p_address_id, v_subtotal, v_delivery_fee, v_total,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_card_message, '')), ''),
    'pending_payment', v_delivery_date, v_slot, v_is_surprise, v_recipient_phone
  )
  returning id, order_code into v_order_id, v_order_code;

  -- Snapshot line items from the cart at live prices.
  insert into public.order_items (order_id, product_id, qty, unit_price)
    select v_order_id, ci.product_id, ci.qty, p.price
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid;

  -- Clear the cart.
  delete from public.cart_items where user_id = v_uid;

  return query select v_order_id, v_order_code, v_total;
end;
$$;

grant execute on function public.create_order_from_cart(bigint, text, text, jsonb) to authenticated;

-- The RPC (SECURITY DEFINER, owner = postgres) is now the ONLY sanctioned way
-- to create an order. Block direct PostgREST inserts with the anon key.
revoke insert on public.orders from authenticated;
revoke insert on public.order_items from authenticated;
