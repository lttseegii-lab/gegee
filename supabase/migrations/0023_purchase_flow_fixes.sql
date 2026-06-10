-- ============================================================
-- 0023 — Purchase-flow audit fixes
-- ============================================================
-- Idempotent. Covers:
--   1A  DIY (custom) bouquets were rejected by the order RPC's active-guard
--   2D  double-submit could create two orders (lock the cart)
--   1B  stale-pending sweep was too eager (paid-after-sweep money loss)
--   3E  loyalty points should accrue on merchandise (subtotal), not delivery
--   3C  schedule the stale-pending sweep (best-effort pg_cron)
--   4C  qpay_invoice_id uniqueness, qpay_paid_amount, paid_at always set
-- ============================================================


-- ───────────────────────────────────────────────────────────
-- 1A + 2D — Order creation RPC: allow custom-DIY products through the
-- active-guard, and serialize concurrent checkouts of the same cart.
-- (Full create-or-replace of the 0021 function with two changes.)
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

  -- 2D: serialize concurrent checkouts of the same cart. Locking this user's
  -- cart rows means a double-submit / second tab blocks until the first commits
  -- its cart-clear, then sees an empty cart and fails cleanly (no duplicate order).
  perform 1 from public.cart_items where user_id = v_uid for update;

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

  -- Cart must be non-empty and every product still buyable. A custom DIY
  -- product is intentionally active=false (hidden from the catalog) but IS
  -- orderable — identified by the 'custom-diy' tag. Only reject genuinely
  -- deactivated catalog products and missing rows.
  if not exists (select 1 from public.cart_items where user_id = v_uid) then
    raise exception 'Cart is empty';
  end if;
  if exists (
    select 1
    from public.cart_items ci
    left join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid
      and (
        p.id is null
        or (p.active = false
            and not ('custom-diy' = any(coalesce(p.tags, '{}'::text[]))))
      )
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

  -- Capacity: free abandoned holds, then enforce the cap under a row lock.
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

  insert into public.order_items (order_id, product_id, qty, unit_price)
    select v_order_id, ci.product_id, ci.qty, p.price
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid;

  delete from public.cart_items where user_id = v_uid;

  return query select v_order_id, v_order_code, v_total;
end;
$$;


-- ───────────────────────────────────────────────────────────
-- 1B — Stale-pending sweep no longer cancels orders that already have a QPay
-- invoice unless they're genuinely old, so a buyer who pays a few minutes late
-- isn't cancelled out from under their payment. TTL raised 15 → 30 min.
-- ───────────────────────────────────────────────────────────
create or replace function public.expire_stale_pending_orders(
  ttl interval default interval '30 minutes'
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
        -- Don't sweep an order that has an invoice out unless it's well past
        -- the window — the buyer may be mid-payment.
        and (qpay_invoice_id is null or created_at < now() - greatest(ttl, interval '30 minutes'))
      returning 1
  )
  select count(*) into n from expired;
  return n;
end;
$$;


-- ───────────────────────────────────────────────────────────
-- 3E — Loyalty points accrue on merchandise value (subtotal), not on the
-- delivery fee. credit + reverse must agree. Only affects future paid orders.
-- ───────────────────────────────────────────────────────────
create or replace function public.credit_points_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rate numeric;
  pts  integer;
begin
  if (tg_op = 'UPDATE' and new.status = 'paid' and old.status is distinct from 'paid') then
    rate := coalesce(public.gegeen_earn_rate(), 3.0);
    pts  := floor(new.subtotal * rate / 100.0)::integer;

    if pts > 0 then
      insert into public.rewards_ledger (user_id, points, reason, order_id)
      values (
        new.user_id,
        pts,
        'Захиалга ' || coalesce(new.order_code, '#' || new.id::text)
          || ' (' || rate || '%)',
        new.id
      );
      insert into public.user_rewards (user_id, total_points, total_spent)
      values (new.user_id, pts, new.subtotal)
      on conflict (user_id) do update
        set total_points = user_rewards.total_points + pts,
            total_spent  = user_rewards.total_spent + new.subtotal;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.reverse_points_on_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rate numeric;
  pts  integer;
begin
  if (tg_op = 'UPDATE' and new.status in ('refunded', 'cancelled')
      and old.status in ('paid', 'preparing', 'shipped', 'delivered')) then
    rate := coalesce(public.gegeen_earn_rate(), 3.0);
    pts  := floor(new.subtotal * rate / 100.0)::integer;

    if pts > 0 then
      insert into public.rewards_ledger (user_id, points, reason, order_id)
      values (
        new.user_id,
        -pts,
        'Захиалга цуцалсан ' || coalesce(new.order_code, '#' || new.id::text),
        new.id
      );
      update public.user_rewards
        set total_points = greatest(total_points - pts, 0),
            total_spent  = greatest(total_spent - new.subtotal, 0)
        where user_id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;


-- ───────────────────────────────────────────────────────────
-- 4C — Order payment columns/constraints.
-- ───────────────────────────────────────────────────────────
-- Record the actually-settled amount (for over/underpayment reconciliation).
alter table public.orders
  add column if not exists qpay_paid_amount integer;

-- An invoice belongs to exactly one order. (Guarded so the migration can't fail
-- on pre-existing duplicates.)
do $$
begin
  if not exists (
    select 1 from public.orders
    where qpay_invoice_id is not null
    group by qpay_invoice_id having count(*) > 1
  ) then
    create unique index if not exists uniq_qpay_invoice
      on public.orders(qpay_invoice_id) where qpay_invoice_id is not null;
  else
    raise notice 'duplicate qpay_invoice_id present — skipping unique index';
  end if;
end$$;

-- Set paid_at on ANY transition into 'paid' (QPay confirm OR admin), so the
-- timeline timestamp is never blank.
create or replace function public.set_paid_at_on_paid()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paid'
     and old.status is distinct from 'paid'
     and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_paid_at on public.orders;
create trigger trg_set_paid_at
  before update on public.orders
  for each row execute function public.set_paid_at_on_paid();


-- ───────────────────────────────────────────────────────────
-- 3C — Schedule the stale-pending sweep every 5 min if pg_cron is available.
-- Best-effort: never fail the migration if the extension can't be enabled.
-- (The order RPC also sweeps opportunistically on every checkout.)
-- ───────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'sweep-pending-orders',
      '*/5 * * * *',
      $cron$select public.expire_stale_pending_orders()$cron$
    );
  else
    raise notice 'pg_cron not available — relying on opportunistic sweep + manual/Vercel cron';
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end$$;
