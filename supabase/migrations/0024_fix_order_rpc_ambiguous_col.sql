-- ============================================================
-- 0024 — Fix create_order_from_cart: ambiguous "order_code" reference
-- ============================================================
-- The RETURNS TABLE (order_id, order_code, total) output columns create
-- implicit plpgsql variables that collide with the orders table's own columns.
-- The `insert ... returning id, order_code into ...` therefore raised
--   42702: column reference "order_code" is ambiguous
-- which surfaced to the buyer as the generic "Захиалга үүсгэхэд алдаа гарлаа".
-- Fix: qualify the table column (orders.order_code) in RETURNING. Forward-only
-- re-create of the function (0023 stays as the applied historical record).
-- ============================================================

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

  -- Serialize concurrent checkouts of the same cart (double-submit guard).
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

  -- Cart must be non-empty and every product still buyable (custom DIY allowed).
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

  -- Insert order (trg_sync_capacity recomputes current_orders). Qualify
  -- orders.order_code so it isn't ambiguous with the RETURNS TABLE column.
  insert into public.orders (
    user_id, address_id, subtotal, delivery_fee, total, notes, card_message,
    status, delivery_date, delivery_slot, is_surprise, recipient_phone
  ) values (
    v_uid, p_address_id, v_subtotal, v_delivery_fee, v_total,
    nullif(btrim(coalesce(p_notes, '')), ''),
    nullif(btrim(coalesce(p_card_message, '')), ''),
    'pending_payment', v_delivery_date, v_slot, v_is_surprise, v_recipient_phone
  )
  returning id, orders.order_code into v_order_id, v_order_code;

  insert into public.order_items (order_id, product_id, qty, unit_price)
    select v_order_id, ci.product_id, ci.qty, p.price
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.user_id = v_uid;

  delete from public.cart_items where user_id = v_uid;

  return query select v_order_id, v_order_code, v_total;
end;
$$;

grant execute on function public.create_order_from_cart(bigint, text, text, jsonb) to authenticated;
