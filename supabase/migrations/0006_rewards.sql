-- ============================================================
-- Gegeen Phase 2 — Rewards / loyalty points
-- ============================================================
-- 1 point per 1000₮ spent (10%-р хувь). Auto-credited when order status
-- transitions to 'paid'. Tier derived from cumulative spend.
--
-- Tier thresholds (cumulative spend):
--   Petal:    0 - 499,999₮
--   Stem:     500,000 - 1,499,999₮
--   Garden:   1,500,000 - 4,999,999₮
--   Atelier:  5,000,000+ ₮

-- ───── 1. rewards_ledger (immutable audit log) ─────
create table if not exists public.rewards_ledger (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Positive: earned. Negative: redeemed/expired.
  points       integer not null,
  -- Free-text reason (e.g. "Захиалга GG-260521-0001", "Welcome bonus")
  reason       text not null,
  -- Reference to order if relevant (so admin can trace)
  order_id     bigint references public.orders(id),
  created_at   timestamptz not null default now()
);
create index if not exists idx_rewards_ledger_user_created
  on public.rewards_ledger(user_id, created_at desc);

-- ───── 2. user_rewards (current state — view + materialized count) ─────
-- We use a real table (not view) for fast lookups + tier index.
create table if not exists public.user_rewards (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  total_points       integer not null default 0,
  total_spent        bigint not null default 0,
  tier               text generated always as (
    case
      when total_spent >= 5000000 then 'Atelier'
      when total_spent >= 1500000 then 'Garden'
      when total_spent >=  500000 then 'Stem'
      else 'Petal'
    end
  ) stored,
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_user_rewards_updated_at on public.user_rewards;
create trigger trg_user_rewards_updated_at
  before update on public.user_rewards
  for each row execute function public.set_updated_at();

-- ───── 3. Trigger: on auth.users insert → create user_rewards row + welcome bonus ─────
create or replace function public.handle_new_user_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Initialize rewards row
  insert into public.user_rewards (user_id) values (new.id)
    on conflict (user_id) do nothing;
  -- Welcome bonus: 250 points
  insert into public.rewards_ledger (user_id, points, reason)
  values (new.id, 250, 'Тавтай морилно уу 🌸');
  update public.user_rewards
    set total_points = total_points + 250
    where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rewards on auth.users;
create trigger on_auth_user_created_rewards
  after insert on auth.users
  for each row execute function public.handle_new_user_rewards();

-- ───── 4. Trigger: on order status → 'paid' → credit points ─────
-- Points earned = floor(total / 1000) → 1 point per 1000₮ spent
create or replace function public.credit_points_on_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pts integer;
begin
  -- Only credit when transitioning TO 'paid'
  if (tg_op = 'UPDATE' and new.status = 'paid' and old.status is distinct from 'paid') then
    pts := floor(new.total / 1000)::integer;
    if pts > 0 then
      -- Add to ledger
      insert into public.rewards_ledger (user_id, points, reason, order_id)
      values (new.user_id, pts, 'Захиалга ' || coalesce(new.order_code, '#' || new.id::text), new.id);
      -- Update aggregate
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

drop trigger if exists trg_credit_points_on_paid on public.orders;
create trigger trg_credit_points_on_paid
  after update on public.orders
  for each row execute function public.credit_points_on_paid();

-- ───── 5. Trigger: on order status → 'refunded' or 'cancelled' (after being paid) → reverse points ─────
create or replace function public.reverse_points_on_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pts integer;
begin
  -- Reverse only when transitioning FROM 'paid' (or later) TO 'refunded'/'cancelled'
  if (tg_op = 'UPDATE' and new.status in ('refunded', 'cancelled')
      and old.status in ('paid', 'preparing', 'shipped', 'delivered')) then
    pts := floor(new.total / 1000)::integer;
    if pts > 0 then
      insert into public.rewards_ledger (user_id, points, reason, order_id)
      values (new.user_id, -pts, 'Захиалга цуцалсан ' || coalesce(new.order_code, '#' || new.id::text), new.id);
      update public.user_rewards
        set total_points = greatest(total_points - pts, 0),
            total_spent  = greatest(total_spent - new.total, 0)
        where user_id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reverse_points_on_refund on public.orders;
create trigger trg_reverse_points_on_refund
  after update on public.orders
  for each row execute function public.reverse_points_on_refund();

-- ───── 6. Backfill: create user_rewards rows for existing users (idempotent) ─────
insert into public.user_rewards (user_id)
  select id from auth.users
  on conflict (user_id) do nothing;

-- ───── 7. RLS ─────
alter table public.user_rewards enable row level security;
alter table public.rewards_ledger enable row level security;

drop policy if exists "user_rewards_owner_read" on public.user_rewards;
create policy "user_rewards_owner_read" on public.user_rewards
  for select using (auth.uid() = user_id);

drop policy if exists "user_rewards_admin_read" on public.user_rewards;
create policy "user_rewards_admin_read" on public.user_rewards
  for select using (public.is_admin());

drop policy if exists "rewards_ledger_owner_read" on public.rewards_ledger;
create policy "rewards_ledger_owner_read" on public.rewards_ledger
  for select using (auth.uid() = user_id);

drop policy if exists "rewards_ledger_admin_read" on public.rewards_ledger;
create policy "rewards_ledger_admin_read" on public.rewards_ledger
  for select using (public.is_admin());
-- writes only via trigger (security definer) — no direct insert policy

-- ───── 8. Update handle_new_user trigger to skip if rewards trigger already covered ─────
-- (No change needed — both triggers fire on auth.users INSERT independently.)
