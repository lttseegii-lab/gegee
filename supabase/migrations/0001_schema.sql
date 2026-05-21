-- ============================================================
-- Gegeen E-Commerce — Initial schema (Phase 1 MVP)
-- Created: 2026-05-21
-- ============================================================

-- ───── Custom types ─────
create type order_status as enum (
  'pending_payment',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- ───── profiles (1:1 with auth.users) ─────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text not null,
  phone       text,
  provider    text default 'email',
  avatar_url  text,
  joined_at   timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───── products (public-read catalog) ─────
create table public.products (
  id          text primary key,         -- slug: 'the-saraa'
  name        text not null,
  price       integer not null,         -- MNT (whole tugriks)
  rating      numeric(2,1),
  reviews     integer default 0,
  badge       text,                     -- 'top-pick' | 'new-pill' | 'letterbox-pill' | 'double-points'
  pet_safe    boolean default false,
  tags        text[] default '{}',
  occasion    text[] default '{}',
  img_seed    integer,
  img_prompt  text,
  img_url     text,                     -- Pre-rendered cache URL from Supabase Storage
  active      boolean default true,
  created_at  timestamptz default now()
);
create index idx_products_tags     on public.products using gin(tags);
create index idx_products_occasion on public.products using gin(occasion);
create index idx_products_active   on public.products(active) where active;

-- ───── cart_items ─────
create table public.cart_items (
  user_id     uuid references auth.users(id) on delete cascade,
  product_id  text references public.products(id) on delete cascade,
  qty         smallint not null check (qty between 1 and 20),
  added_at    timestamptz default now(),
  primary key (user_id, product_id)
);
create index idx_cart_user on public.cart_items(user_id);

-- ───── wishlist_items ─────
create table public.wishlist_items (
  user_id     uuid references auth.users(id) on delete cascade,
  product_id  text references public.products(id) on delete cascade,
  added_at    timestamptz default now(),
  primary key (user_id, product_id)
);

-- ───── addresses ─────
create table public.addresses (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  label       text not null,            -- 'Гэр' | 'Ажил' | 'Бусад'
  recipient   text not null,
  phone       text not null,
  city        text default 'Улаанбаатар',
  district    text,
  khoroo      text,
  building    text,
  entrance    text,
  floor       text,
  unit        text,
  notes       text,
  is_default  boolean default false,
  created_at  timestamptz default now()
);
create index idx_addresses_user on public.addresses(user_id);
-- Only one default address per user
create unique index uniq_user_default_addr
  on public.addresses(user_id) where is_default;

-- ───── orders ─────
create table public.orders (
  id              bigserial primary key,
  -- Human-readable code: GG-260521-0001 (populated by trigger on INSERT)
  order_code      text,
  user_id         uuid references auth.users(id) on delete cascade,
  address_id      bigint references public.addresses(id),
  subtotal        integer not null,
  delivery_fee    integer default 0,
  total           integer not null,
  status          order_status default 'pending_payment',
  qpay_invoice_id text,                 -- QPay invoice reference
  qpay_payment_id text,                 -- QPay payment ID (for idempotency)
  notes           text,
  created_at      timestamptz default now(),
  paid_at         timestamptz,
  delivered_at    timestamptz
);

-- Trigger to set order_code on INSERT (generated columns can't use to_char
-- because timezone conversion isn't immutable)
create or replace function public.set_order_code()
returns trigger language plpgsql as $$
begin
  new.order_code := 'GG-' || to_char(new.created_at at time zone 'UTC', 'YYMMDD')
                    || '-' || lpad(new.id::text, 4, '0');
  return new;
end$$;

create trigger trg_orders_set_code
  before insert on public.orders
  for each row execute function public.set_order_code();
create index idx_orders_user_date on public.orders(user_id, created_at desc);
create index idx_orders_status    on public.orders(status);
create unique index uniq_qpay_payment on public.orders(qpay_payment_id) where qpay_payment_id is not null;

-- ───── order_items (price snapshot at order time) ─────
create table public.order_items (
  order_id    bigint references public.orders(id) on delete cascade,
  product_id  text references public.products(id),
  qty         smallint not null,
  unit_price  integer not null,         -- snapshot, does not change if products.price changes
  primary key (order_id, product_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.cart_items     enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.addresses      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- products: anyone (even anon) can read active products
create policy "products_public_read" on public.products
  for select using (active = true);

-- profiles: users see/edit their own profile
create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- cart_items: full owner CRUD
create policy "cart_owner_all" on public.cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- wishlist_items: full owner CRUD
create policy "wishlist_owner_all" on public.wishlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- addresses: full owner CRUD
create policy "addresses_owner_all" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders: owner can read + insert; updates only via service_role (QPay webhook)
create policy "orders_owner_select" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders_owner_insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- order_items: visible if parent order is owned by user
create policy "order_items_owner_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
create policy "order_items_owner_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- Helper: updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
