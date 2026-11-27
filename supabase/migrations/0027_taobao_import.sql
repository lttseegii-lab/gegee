-- ============================================================
-- Taobao import — bedding products sourced from Taobao
-- ============================================================
-- 1. Public product copy that imported items need (name alone is not enough
--    for bedding: material, size, piece count, colour options).
-- 2. product_sources: admin-only link back to the Taobao listing + unit cost.
-- 3. admin_settings: admin-only key/value store (site_settings is world
--    readable, so the margin must not live there).
-- 4. Guard: a product imported from sample data can never go live.

alter table public.products
  add column if not exists description text,
  add column if not exists details  text[] not null default '{}',
  add column if not exists variants text[] not null default '{}';

create table if not exists public.product_sources (
  product_id  text primary key references public.products(id) on delete cascade,
  source      text not null check (source in ('taobao')),
  item_id     text not null,
  url         text,
  title_zh    text not null,
  price_cny   numeric(10,2) not null check (price_cny > 0),
  cost        integer not null check (cost >= 0),     -- MNT landed cost per unit
  sample      boolean not null default false,          -- made-up demo listing
  created_at  timestamptz not null default now(),
  unique (source, item_id)
);

alter table public.product_sources enable row level security;

drop policy if exists "product_sources_admin_all" on public.product_sources;
create policy "product_sources_admin_all" on public.product_sources
  for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.admin_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_admin_settings_updated_at on public.admin_settings;
create trigger trg_admin_settings_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

alter table public.admin_settings enable row level security;

drop policy if exists "admin_settings_admin_all" on public.admin_settings;
create policy "admin_settings_admin_all" on public.admin_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Defaults are placeholders: set the real rate, margin and cargo in the admin.
insert into public.admin_settings (key, value) values
  ('taobao_pricing', '{"cnyRate": 500, "marginPercent": 30, "cargoFee": 3000}'::jsonb)
on conflict (key) do nothing;

-- Sample listings are fabricated test data. Customers must never be able to
-- buy them, whichever admin screen flips the switch.
create or replace function public.block_sample_product_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active and exists (
    select 1 from public.product_sources s
    where s.product_id = new.id and s.sample
  ) then
    raise exception 'Жишиг (sample) барааг идэвхжүүлэх боломжгүй';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_sample_product_activation on public.products;
create trigger trg_block_sample_product_activation
  before update of active on public.products
  for each row execute function public.block_sample_product_activation();
