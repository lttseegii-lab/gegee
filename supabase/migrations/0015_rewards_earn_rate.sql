-- ============================================================
-- Gegeen Phase 3 — Admin-configurable points earn rate
-- ============================================================
-- Until now, a paid order awarded a fixed 1 point per 1000₮.
-- Move that rate into site_settings.rewards_config.earnRatePercent
-- so admin can tune it from /admin/rewards.
--
-- New formula:  pts = floor(order_total * earnRatePercent / 100)
-- Fallback:     3% (matches the new default in lib/rewards/config.ts)
--
-- Existing rewards_ledger rows are left untouched — this change only
-- affects future paid orders.

-- ───── Helper: read earn rate from site_settings ─────
create or replace function public.gegeen_earn_rate()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (value->>'earnRatePercent')::numeric,
    3.0
  )
  from public.site_settings
  where key = 'rewards_config'
  limit 1;
$$;

-- ───── Update credit_points_on_paid ─────
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
    pts  := floor(new.total * rate / 100.0)::integer;

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
      values (new.user_id, pts, new.total)
      on conflict (user_id) do update
        set total_points = user_rewards.total_points + pts,
            total_spent  = user_rewards.total_spent + new.total;
    end if;
  end if;
  return new;
end;
$$;

-- ───── Update reverse_points_on_refund (mirror the new formula) ─────
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
    pts  := floor(new.total * rate / 100.0)::integer;

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
            total_spent  = greatest(total_spent - new.total, 0)
        where user_id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;
