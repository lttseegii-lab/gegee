-- ============================================================
-- Gegeen — Admin/backoffice schema (Phase 1)
-- Adds: profiles.role, daily_capacity, admin RLS policies, capacity RPC
-- ============================================================

-- ───── 1. role column on profiles ─────
alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'admin'));

create index if not exists idx_profiles_role on public.profiles(role)
  where role = 'admin';

-- ───── 2. daily_capacity table ─────
create table if not exists public.daily_capacity (
  date           date primary key,
  max_orders     integer not null default 50 check (max_orders >= 0),
  current_orders integer not null default 0 check (current_orders >= 0),
  notes          text,
  closed         boolean not null default false,
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_capacity_updated_at on public.daily_capacity;
create trigger trg_capacity_updated_at
  before update on public.daily_capacity
  for each row execute function public.set_updated_at();

-- ───── 3. try_reserve_capacity RPC ─────
-- Atomically increments current_orders for the given date if there's room.
-- Returns true if reserved, false if the day is closed or full.
create or replace function public.try_reserve_capacity(target_date date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  insert into public.daily_capacity(date)
  values (target_date)
  on conflict (date) do nothing;

  update public.daily_capacity
  set current_orders = current_orders + 1
  where date = target_date
    and not closed
    and current_orders < max_orders
  returning true into ok;

  return coalesce(ok, false);
end;
$$;
grant execute on function public.try_reserve_capacity(date) to authenticated;

-- Also release capacity on cancellation
create or replace function public.release_capacity(target_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.daily_capacity
  set current_orders = greatest(current_orders - 1, 0)
  where date = target_date;
end;
$$;
grant execute on function public.release_capacity(date) to authenticated;

-- ───── 4. Helper: is_admin() ─────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to authenticated, anon;

-- ───── 5. RLS for daily_capacity ─────
alter table public.daily_capacity enable row level security;

drop policy if exists "capacity_public_read" on public.daily_capacity;
create policy "capacity_public_read" on public.daily_capacity
  for select using (true);

drop policy if exists "capacity_admin_write" on public.daily_capacity;
create policy "capacity_admin_write" on public.daily_capacity
  for insert with check (public.is_admin());

drop policy if exists "capacity_admin_update" on public.daily_capacity;
create policy "capacity_admin_update" on public.daily_capacity
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "capacity_admin_delete" on public.daily_capacity;
create policy "capacity_admin_delete" on public.daily_capacity
  for delete using (public.is_admin());

-- ───── 6. Admin policies on existing tables ─────
-- Admin can SELECT/UPDATE/DELETE on orders (status changes etc)
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select" on public.orders
  for select using (public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete using (public.is_admin());

-- Order items
drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select" on public.order_items
  for select using (public.is_admin());

-- Products — admin can write (existing read is public)
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

-- Profiles — admin can read all
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

-- Addresses — admin can read all
drop policy if exists "addresses_admin_select" on public.addresses;
create policy "addresses_admin_select" on public.addresses
  for select using (public.is_admin());

-- Cart + wishlist visibility for admin (debugging customer support)
drop policy if exists "cart_admin_select" on public.cart_items;
create policy "cart_admin_select" on public.cart_items
  for select using (public.is_admin());

drop policy if exists "wishlist_admin_select" on public.wishlist_items;
create policy "wishlist_admin_select" on public.wishlist_items
  for select using (public.is_admin());

-- ───── 7. Bootstrap: promote lt.tseegii@gmail.com to admin ─────
-- Idempotent: only updates if a profile with this email exists.
update public.profiles
set role = 'admin'
where email = 'lt.tseegii@gmail.com';
