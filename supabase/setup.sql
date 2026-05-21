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
  -- Human-readable code: GG-260521-0001
  order_code      text generated always as (
    'GG-' || to_char(created_at, 'YYMMDD') || '-' || lpad(id::text, 4, '0')
  ) stored,
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
-- ============================================================
-- Gegeen — Auth triggers
-- On auth.users INSERT → auto-create profiles row
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, provider, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_app_meta_data->>'provider',
      'email'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RPC: merge_guest_cart
-- Called after login to merge anonymous (localStorage) cart with server cart.
-- Greater qty wins per product (user intent: keep max selection).
-- ============================================================
create or replace function public.merge_guest_cart(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
begin
  if uid is null then
    raise exception 'auth required';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    insert into public.cart_items (user_id, product_id, qty)
    values (
      uid,
      item->>'id',
      least(20, greatest(1, (item->>'qty')::int))
    )
    on conflict (user_id, product_id)
    do update set qty = least(20, greatest(cart_items.qty, excluded.qty));
  end loop;
end;
$$;

grant execute on function public.merge_guest_cart(jsonb) to authenticated;

-- ============================================================
-- RPC: set_default_address
-- Atomically clear other defaults and mark the given address as default.
-- ============================================================
create or replace function public.set_default_address(addr_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'auth required';
  end if;

  -- Verify the address belongs to the user
  if not exists (
    select 1 from public.addresses
    where id = addr_id and user_id = uid
  ) then
    raise exception 'address not found or not owned';
  end if;

  update public.addresses
    set is_default = false
    where user_id = uid and id <> addr_id;

  update public.addresses
    set is_default = true
    where id = addr_id;
end;
$$;

grant execute on function public.set_default_address(bigint) to authenticated;
-- ============================================================
-- Gegeen — Product seed (24 products from prototype)
-- Extracted from /Users/marktech/Projects/Flowers/index.html line 10219-10331
-- ============================================================

insert into public.products
  (id, name, price, rating, reviews, badge, pet_safe, tags, occasion, img_seed, img_prompt)
values
  -- Signature flower bouquets
  ('the-saraa', 'The Saraa', 89000, 4.9, 7533, 'top-pick', true,
   ARRAY['bouquet','hand-tied','peony','rose','romance','pet-safe','bestseller','flowers','цэцэг','baglaa'],
   ARRAY['romance','birthday','just-because'],
   2001, 'pink peony and rose hand-tied bouquet wrapped in kraft paper on table, lifestyle photography, soft natural light, square composition'),

  ('the-anu', 'The Anu', 119000, 4.8, 4451, 'double-points', false,
   ARRAY['letterbox','tulip','sunflower','yellow','bestseller','flowers','цэцэг'],
   ARRAY['birthday','celebration','just-because'],
   2002, 'yellow tulip and sunflower bouquet in letterbox style delivery box, lifestyle photography, soft natural light, square composition'),

  ('the-tuya', 'The Tuya', 169000, 4.9, 1127, 'new-pill', false,
   ARRAY['premium','anemone','luxury','mystery','new','flowers','цэцэг'],
   ARRAY['mystery','romance','anniversary'],
   2003, 'deep burgundy purple anemone luxury bouquet in dark vase, moody lifestyle photography, square composition'),

  ('the-nomin', 'The Nomin', 229000, 4.9, 3008, 'letterbox-pill', true,
   ARRAY['premium','eucalyptus','sage','calm','pet-safe','letterbox','flowers','цэцэг'],
   ARRAY['calm','sympathy','celebration'],
   2004, 'elegant white sage eucalyptus bouquet in ceramic vase, soft lifestyle photography, square composition'),

  -- Peonies
  ('pink-peony-garden', 'Pink Peony Garden', 159000, 4.9, 892, 'top-pick', false,
   ARRAY['peony','romance','pink','hand-tied','spring','flowers','цэцэг','пион'],
   ARRAY['romance','birthday','anniversary','spring'],
   2005, 'lush pink peonies bouquet in glass vase on table, lifestyle photography, soft natural light, square composition'),

  ('white-peony', 'White Peony Whisper', 179000, 4.8, 445, null, false,
   ARRAY['peony','white','elegant','wedding','luxury','flowers','цэцэг','пион'],
   ARRAY['celebration','wedding','anniversary'],
   2006, 'elegant white peonies bouquet in ceramic vase, lifestyle photography, soft cream background, square composition'),

  -- Letterbox
  ('pocket-pink', 'Pocket Pink', 69000, 4.7, 2104, 'letterbox-pill', true,
   ARRAY['letterbox','pink','peach','affordable','pet-safe','flowers','цэцэг'],
   ARRAY['just-because','birthday','romance'],
   2007, 'small pink peach flower delivery letterbox box opened on table, lifestyle photography, square composition'),

  ('pocket-sunshine', 'Pocket Sunshine', 59000, 4.6, 1834, 'letterbox-pill', false,
   ARRAY['letterbox','yellow','gold','affordable','sunflower','flowers','цэцэг'],
   ARRAY['birthday','just-because','celebration'],
   2008, 'yellow sunflower tulip letterbox delivery box with kraft paper, lifestyle photography, square composition'),

  ('pocket-sage', 'Pocket Sage', 79000, 4.8, 1245, 'letterbox-pill', true,
   ARRAY['letterbox','sage','eucalyptus','calm','pet-safe','flowers','цэцэг'],
   ARRAY['calm','sympathy','just-because'],
   2009, 'sage green eucalyptus and white flowers letterbox box, minimalist lifestyle photography, square composition'),

  -- Hampers
  ('tea-hamper', 'Afternoon Tea Set', 189000, 4.8, 567, null, false,
   ARRAY['hamper','tea','food','gift-set','хамтар','бэлэг'],
   ARRAY['birthday','just-because','sympathy'],
   2010, 'afternoon tea hamper basket with shortbread biscuits scones and small bouquet on wooden table, lifestyle photography, square composition'),

  ('chocolate-hamper', 'Chocolate Lovers Box', 159000, 4.9, 1212, 'new-pill', false,
   ARRAY['hamper','chocolate','food','gift-set','new','шоколад','бэлэг'],
   ARRAY['birthday','romance','just-because'],
   2011, 'luxury chocolate truffles gift box with pink flower bouquet on dark table, lifestyle photography, square composition'),

  ('wine-flowers', 'Wine & Flowers Duo', 219000, 4.7, 823, null, false,
   ARRAY['hamper','wine','gift-set','luxury','бэлэг'],
   ARRAY['celebration','anniversary','romance'],
   2012, 'red wine bottle with pink rose bouquet gift set on wooden tray, lifestyle photography, square composition'),

  -- Plants
  ('monstera-petite', 'Monstera Petite', 89000, 4.7, 892, null, false,
   ARRAY['plant','houseplant','green','low-maintenance','таримал'],
   ARRAY['housewarming','just-because','self-care'],
   2013, 'small monstera deliciosa plant in white ceramic pot on wooden shelf, modern interior, lifestyle photography, square composition'),

  ('orchid-elegance', 'Orchid Elegance', 129000, 4.8, 445, null, true,
   ARRAY['plant','orchid','elegant','pet-safe','luxury','таримал'],
   ARRAY['celebration','sympathy','housewarming'],
   2014, 'elegant white phalaenopsis orchid in tall ceramic pot on table, lifestyle photography, soft natural light, square composition'),

  ('succulent-trio', 'Succulent Trio', 69000, 4.6, 1567, null, true,
   ARRAY['plant','succulent','small','pet-safe','low-maintenance','таримал'],
   ARRAY['housewarming','just-because','self-care'],
   2015, 'three small succulent plants in white pots on wooden table, scandinavian interior, lifestyle photography, square composition'),

  -- Cards
  ('birthday-card', 'Birthday Joy Card', 14000, 4.9, 3334, null, false,
   ARRAY['card','birthday','colorful','greeting','карт'],
   ARRAY['birthday'],
   2016, 'colorful illustrated birthday greeting card with confetti on table, lifestyle photography, square composition'),

  ('thanks-card', 'Thank You Card', 12000, 4.8, 2102, null, false,
   ARRAY['card','thanks','minimal','greeting','карт'],
   ARRAY['gratitude','just-because'],
   2017, 'minimal thank you greeting card with small flower illustration on wooden table, lifestyle photography, square composition'),

  ('sympathy-card', 'With Sympathy', 14000, 4.9, 892, null, false,
   ARRAY['card','sympathy','calm','greeting','карт'],
   ARRAY['sympathy','apology'],
   2018, 'elegant sympathy card with white lily illustration on cream background, lifestyle photography, square composition'),

  -- Subscriptions
  ('petite-weekly', 'Petite Weekly', 89000, 4.9, 2233, null, true,
   ARRAY['subscription','weekly','affordable','pet-safe','захиалга'],
   ARRAY['weekly','self-care'],
   2019, 'weekly flower subscription delivery box with small bouquet on table, lifestyle photography, square composition'),

  ('signature-monthly', 'Signature Atelier', 169000, 4.9, 1556, 'top-pick', false,
   ARRAY['subscription','monthly','signature','premium','захиалга'],
   ARRAY['monthly','self-care','anniversary'],
   2020, 'monthly signature flower subscription box with pink peonies inside, lifestyle photography, square composition'),

  -- Additional variety
  ('spring-tulips', 'Spring Tulips', 79000, 4.7, 1567, null, true,
   ARRAY['tulip','spring','yellow','pet-safe','flowers','цэцэг','хаврын'],
   ARRAY['just-because','spring','birthday'],
   2021, 'yellow and pink tulip spring bouquet in glass vase, lifestyle photography, soft natural light, square composition'),

  ('pure-lily', 'Pure Lily', 139000, 4.8, 723, null, false,
   ARRAY['lily','white','elegant','sympathy','flowers','цэцэг'],
   ARRAY['sympathy','celebration','apology'],
   2022, 'pure white lily bouquet in ceramic vase on cream background, elegant lifestyle photography, square composition'),

  ('sunny-day', 'Sunny Day', 89000, 4.8, 1923, null, true,
   ARRAY['sunflower','yellow','cheerful','pet-safe','flowers','цэцэг','наран'],
   ARRAY['birthday','just-because','celebration'],
   2023, 'cheerful sunflowers bouquet in vase with warm sunlight, lifestyle photography, square composition'),

  ('lavender-calm', 'Lavender Calm', 109000, 4.7, 856, null, true,
   ARRAY['lavender','purple','calm','pet-safe','dried','flowers','цэцэг','хатсан'],
   ARRAY['calm','sympathy','self-care'],
   2024, 'lavender purple mixed bouquet in vase with dried elements, calm lifestyle photography, square composition')

on conflict (id) do update set
  name      = excluded.name,
  price     = excluded.price,
  rating    = excluded.rating,
  reviews   = excluded.reviews,
  badge     = excluded.badge,
  pet_safe  = excluded.pet_safe,
  tags      = excluded.tags,
  occasion  = excluded.occasion,
  img_seed  = excluded.img_seed,
  img_prompt = excluded.img_prompt;
