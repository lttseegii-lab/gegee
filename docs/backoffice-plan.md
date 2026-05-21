# Gegeen Backoffice — Phase 1 төлөвлөгөө

> **Зорилго:** `lttseegii-lab/gegee` Next.js app дотор `/admin/*` route-аар florist team-н
> өдөр тутмын ажиллагааны хяналтын самбар. Бодит хэрэглэгчийн захиалга, бүтээгдэхүүн,
> хэрэглэгч, өдрийн capacity 4 модуль.

## Context

Customer-facing MVP `gegeen.vercel.app` дээр live ажиллаж байна:
- 24 product seed
- Authentication, cart, checkout (QPay caркасс), order creation
- 7 хүснэгт + RLS Supabase Postgres дээр

Гэхдээ оператив талаас:
- Захиалга ирсэн үед florist team-д мэдэгдэх + status солих хэрэгсэлгүй
- Бүтээгдэхүүний үнэ/active байдлыг солихын тулд SQL зохиох
- Захиалагч/customer-уудыг харах боломжгүй
- Өдрийн capacity (florist хязгаарлагдмал hand-tied) тооцох механизм байхгүй

Энэ нь launch болоход блок болж байна.

**Хэрэглэгчийн шийдвэр:**
- Архитектур: **Ижил Next.js app /admin/* route**
- MVP: **4 модуль** (Orders + Products + Customers + Daily Capacity)
- Permissions: **Бие даасан `admin` role**

---

## Архитектур

### Route бүтэц

```
apps/web/app/admin/
├── layout.tsx                    # Sidebar nav + role guard
├── page.tsx                      # Dashboard (today's stats)
├── orders/
│   ├── page.tsx                  # Захиалгын жагсаалт
│   ├── [id]/page.tsx             # Захиалгын дэлгэрэнгүй
│   └── actions.ts                # Status update server actions
├── products/
│   ├── page.tsx                  # Бүтээгдэхүүний хүснэгт
│   ├── [id]/page.tsx             # Засах
│   ├── new/page.tsx              # Шинэ нэмэх
│   └── actions.ts
├── customers/
│   ├── page.tsx                  # Хэрэглэгчийн жагсаалт
│   └── [id]/page.tsx             # Хэрэглэгчийн дэлгэрэнгүй
└── capacity/
    ├── page.tsx                  # Өдрийн capacity calendar
    └── actions.ts

apps/web/components/admin/
├── AdminSidebar.tsx              # Side navigation
├── StatusUpdater.tsx             # Status transition buttons
├── CapacityCalendar.tsx          # 14-day grid
├── Stats.tsx                     # Dashboard KPI cards
├── ProductForm.tsx               # Product edit form
└── OrdersTable.tsx               # Reusable table

apps/web/lib/auth/
└── admin.ts                      # requireAdmin() server-side helper
```

### Database schema (Migration `0004_admin.sql`)

```sql
-- 1. profiles.role column
alter table public.profiles
  add column role text not null default 'customer'
  check (role in ('customer', 'admin'));
create index idx_profiles_role on public.profiles(role)
  where role = 'admin';

-- 2. daily_capacity table — өдрийн захиалгын дээд тоо
create table public.daily_capacity (
  date           date primary key,
  max_orders     integer not null default 50 check (max_orders >= 0),
  current_orders integer not null default 0 check (current_orders >= 0),
  notes          text,
  closed         boolean not null default false,
  updated_at     timestamptz not null default now()
);
create trigger trg_capacity_updated_at
  before update on public.daily_capacity
  for each row execute function public.set_updated_at();

-- 3. RPC: атомиксаар capacity reserve хийх (checkout-д ашиглана)
create or replace function public.try_reserve_capacity(target_date date)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare ok boolean;
begin
  insert into public.daily_capacity(date) values (target_date)
    on conflict (date) do nothing;
  update public.daily_capacity
    set current_orders = current_orders + 1
    where date = target_date
      and not closed
      and current_orders < max_orders
    returning true into ok;
  return coalesce(ok, false);
end$$;
grant execute on function public.try_reserve_capacity(date) to authenticated;

-- 4. RLS for new + updated policies
alter table public.daily_capacity enable row level security;

-- daily_capacity: admin full, anon read (хэрэглэгчид availability шалгана)
create policy "capacity_admin_all" on public.daily_capacity
  for all
  using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'))
  with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "capacity_public_read" on public.daily_capacity
  for select using (true);

-- Existing tables: admin can read+write everything
create policy "orders_admin_all" on public.orders
  for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "order_items_admin_all" on public.order_items
  for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "products_admin_write" on public.products
  for insert with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "products_admin_update" on public.products
  for update using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "profiles_admin_read" on public.profiles
  for select using (
    auth.uid() = id
    or exists(select 1 from public.profiles where id=auth.uid() and role='admin')
  );
create policy "addresses_admin_read" on public.addresses
  for select using (
    user_id = auth.uid()
    or exists(select 1 from public.profiles where id=auth.uid() and role='admin')
  );
```

### Bootstrap эхний admin

Migration push хийсний дараа эхний admin-ыг manual SQL-ээр тохируулна:

```sql
update public.profiles
set role = 'admin'
where email = 'lt.tseegii@gmail.com';
```

Дараа нь бусад admin-ийг UI-аар (Phase 2) эсвэл SQL-ээр нэмж болно.

---

## Хуудас бүрийн дизайн

### `/admin` — Dashboard

**KPI cards (4 ширхэг):**
- Өнөөдрийн захиалга (count, status тус бүрээр grouping)
- Өнөөдрийн capacity (X / Y, % full progress bar)
- 7-н өдөрын орлого (₮ дүн)
- Шинэ хэрэглэгч энэ долоо хоногт

**Recent activity:**
- 10 хамгийн сүүлийн захиалга (mini card-ууд → click ▸ /admin/orders/[id])

### `/admin/orders` — Захиалгын жагсаалт

**Filter sidebar (sticky):**
- Status pill chips: `pending_payment` / `paid` / `preparing` / `shipped` / `delivered` / `cancelled`
- Date range: Today / This week / All
- Search by order_code эсвэл customer name/phone

**Table колонк:**
| Order code | Огноо | Хүлээн авагч | Утас | Дүн | Status | Actions |

Click → detail page.

### `/admin/orders/[id]` — Захиалгын дэлгэрэнгүй

**Header:**
- Order code (`GG-260521-0001`)
- Customer name + click → /admin/customers/[id]
- Created at
- Total

**3 column layout (desktop) / Stack (mobile):**

| Items | Address | Status timeline |
|-------|---------|-----------------|
| Product cards with image, name, qty, price | Recipient, phone, city/district/khoroo/building/entrance/floor/unit/notes | Current status pill + next-state buttons + audit log |

**StatusUpdater** (Sprint 7-д):
- `pending_payment` → manual mark "Paid" (хэрэв cash on delivery эсвэл bank transfer)
- `paid` → "Бэлдэж эхлэх" → `preparing`
- `preparing` → "Хүргэлтэнд гарсан" → `shipped`
- `shipped` → "Хүргэгдсэн" → `delivered`
- Any → "Цуцлах" → `cancelled`

Server action нь Supabase update + revalidatePath.

### `/admin/products` — Бүтээгдэхүүн

**Table (24 product):**
| Image | Name | Price | Badge | Tags | Pet-safe | Active | Edit |

**Bulk actions:**
- Toggle all active/inactive
- Search by name/tag
- Sort by price/reviews

**Top right:** "+ Шинэ бүтээгдэхүүн" → `/admin/products/new`

### `/admin/products/[id]` — Edit / `new`

**Form fields:**
- `id` (slug, write once at creation)
- `name`, `price`, `badge` (dropdown: null/top-pick/new-pill/letterbox-pill/double-points)
- `rating`, `reviews` (read-only displayed, edit hidden)
- `pet_safe` (toggle)
- `tags[]` (chip input)
- `occasion[]` (chip input)
- `img_seed` + `img_prompt` (text)
- `img_url` (auto-derived preview from Pollinations)
- `active` (toggle)

**Sidebar:** Image preview (Pollinations URL render)

### `/admin/customers` — Хэрэглэгчид

**Table:**
| Name | Email | Phone | Joined | Orders | Total spent | View |

**Search:** Email/name/phone.

### `/admin/customers/[id]` — Хэрэглэгчийн дэлгэрэнгүй

- Profile (name, email, phone, joined, role)
- Addresses (read-only, list)
- Order history (table by date desc)
- Stats: total spent, avg order, last order date, tier (Phase 2)

### `/admin/capacity` — Өдрийн capacity

**Calendar (next 14 days):**
- Day cell:
  - Date (May 22, Wed)
  - `current_orders / max_orders` (e.g., "12 / 50")
  - Progress bar
  - Closed badge (if closed)
  - Click → inline edit max + close toggle

**Customer flow integration:**
- Checkout flow → `try_reserve_capacity(delivery_date)` RPC дуудна
- Хэрэв `false` буцвал "Энэ өдөр бөглөгдсөн, өөр өдөр сонгоно уу" warning

---

## Implementation phases

### Sprint 6 (1 долоо хоног) — Foundation
1. **Migration 0004_admin.sql** push
2. **`lib/auth/admin.ts`** requireAdmin helper
3. **`app/admin/layout.tsx`** with AdminSidebar + auth gate
4. **`app/admin/page.tsx`** dashboard with 4 KPI cards
5. Bootstrap admin: `lt.tseegii@gmail.com` хэрэглэгчийг admin болгох
6. Verify: customer can't access /admin, admin can

### Sprint 7 (1-2 долоо хоног) — Orders + Products
1. **`/admin/orders/page.tsx`** + filter chips + search
2. **`/admin/orders/[id]/page.tsx`** + StatusUpdater
3. **`/admin/orders/actions.ts`** (`updateOrderStatus`, `cancelOrder`)
4. **`/admin/products/page.tsx`** with toggle + inline price edit
5. **`/admin/products/[id]/page.tsx`** + `new/page.tsx`
6. **`/admin/products/actions.ts`** (CRUD)
7. Mobile responsive UX

### Sprint 8 (1 долоо хоног) — Customers + Capacity
1. **`/admin/customers/page.tsx`** + detail
2. **`/admin/capacity/page.tsx`** calendar
3. **`/admin/capacity/actions.ts`** (setMax, closeDay)
4. **Integrate capacity check** into `createOrderFromCart` checkout flow
5. Show "blocked" warning on customer side

### Sprint 9 (polish, optional) — Quality
- CSV export (orders, customers)
- Bulk status update
- Toast notifications (Sonner)
- Print invoice (browser print stylesheet)
- Status audit trail table

---

## Critical files to create/modify

**Migrations + DB:**
- `supabase/migrations/0004_admin.sql`

**Auth + lib:**
- `apps/web/lib/auth/admin.ts`

**Admin pages (16 files):**
- `apps/web/app/admin/layout.tsx`
- `apps/web/app/admin/page.tsx`
- `apps/web/app/admin/orders/page.tsx`
- `apps/web/app/admin/orders/[id]/page.tsx`
- `apps/web/app/admin/orders/actions.ts`
- `apps/web/app/admin/products/page.tsx`
- `apps/web/app/admin/products/[id]/page.tsx`
- `apps/web/app/admin/products/new/page.tsx`
- `apps/web/app/admin/products/actions.ts`
- `apps/web/app/admin/customers/page.tsx`
- `apps/web/app/admin/customers/[id]/page.tsx`
- `apps/web/app/admin/capacity/page.tsx`
- `apps/web/app/admin/capacity/actions.ts`

**Components:**
- `apps/web/components/admin/AdminSidebar.tsx`
- `apps/web/components/admin/Stats.tsx`
- `apps/web/components/admin/StatusUpdater.tsx`
- `apps/web/components/admin/ProductForm.tsx`
- `apps/web/components/admin/OrdersTable.tsx`
- `apps/web/components/admin/CapacityCalendar.tsx`

**Modify existing:**
- `apps/web/app/checkout/actions.ts` — `try_reserve_capacity` дуудах
- `apps/web/components/checkout/CheckoutForm.tsx` — capacity full warning
- `apps/web/types/database.ts` — regenerate (`npm run types`)

---

## Verification (E2E)

### Setup
```bash
# 1. Push migration
cd /Users/marktech/Projects/Flowers
DB_PASSWORD='Zakhiragch@13' node apps/web/scripts/migrate.mjs

# 2. Bootstrap admin (Dashboard SQL Editor OR direct psql)
UPDATE profiles SET role='admin' WHERE email='lt.tseegii@gmail.com';

# 3. Regenerate types
cd apps/web && npm run types

# 4. Deploy
git push origin main
```

### Happy path test
1. Login as customer at `/auth/login` (өөр хэрэглэгч)
2. Зочлох `/admin` → redirect to `/` (RLS зөв)
3. Logout, login as admin `lt.tseegii@gmail.com`
4. `/admin` → Dashboard 4 KPI харагдана
5. `/admin/orders` → захиалга жагсаалт
6. Захиалга сонгоод "Бэлдэж эхлэх" → `preparing` болсон
7. `/admin/products` → product disable → catalog хуудас тэрийг алга болсон
8. `/admin/capacity` → маргааш max=5 болгож хадгалах
9. Customer flow: 5+ захиалга маргааш үүсгэхэд "blocked" warning
10. `/admin/customers` → нэг хэрэглэгчийн detail → бүх захиалгыг харах

### RLS test
- Anon `select * from orders` → 0 rows
- Customer `select * from orders` → зөвхөн өөрийнх
- Admin `select * from orders` → бүгд
- Customer `update orders set status='paid' where id=X` → fail (зөвхөн service role webhook + admin role)

---

## Хугацаа + cost

| Үе | Хугацаа | Үр дүн |
|-----|---------|--------|
| Sprint 6 | 1 долоо хоног | Foundation, dashboard, role guard |
| Sprint 7 | 1-2 долоо хоног | Orders + Products fully functional |
| Sprint 8 | 1 долоо хоног | Customers + Capacity |
| Sprint 9 | 1 долоо хоног (optional) | Polish, exports, audit |
| **Нийт** | **3-5 долоо хоног** | Florist team-д production-ready backoffice |

**Шинэ infra cost:** $0 (Supabase + Vercel-н одоогийн tier ашиглана)

**Шинэ файл:** ~20 ширхэг, **modify:** ~5 файл

---

## Phase 2 өргөтгөл (post-launch)

- Multi-role (florist / manager / admin)
- Status audit trail хүснэгт (хэн, хэдийд солисон)
- Bulk operations (10 захиалгыг нэг дор preparing болгох)
- Coupons / discount codes
- Email/SMS notifications (Resend + Twilio)
- Analytics dashboard (Plotly эсвэл Recharts)
- Product CSV import/export
- E-баримт API integration

---

## Risk register

| Risk | Магадлал | Хариу арга |
|------|----------|-----------|
| Admin role-ийг шинэ хэрэглэгч хулгайлах | Бага | RLS bullet-proof, role-ийг зөвхөн direct SQL/service role-аас солиж болно |
| Capacity race condition (concurrent checkout) | Дунд | `try_reserve_capacity` RPC нь Postgres-н atomic update ашигладаг ✓ |
| Mobile UX тааруухан → florist төвөгтэй болно | Дунд | Sprint 9-д mobile-first review хийнэ |
| Customer data PII leak | Дунд | RLS test cases чанд, log-д phone/address masking |
| Daily capacity мэдэгдээгүй overcommit | Бага | `default 50` тохиргоо нь UB florist-ийн дундаж capacity дотор. Admin өөрчилнө |
