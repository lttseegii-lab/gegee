-- ============================================================
-- Gegeen Phase 2 — Memory Garden (occasion reminders)
-- ============================================================
-- Users save important dates (birthdays, anniversaries, etc.) and the system
-- can send reminders ahead of those dates + suggest matching bouquets.

create table if not exists public.memory_dates (
  id              bigserial primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Stored as month + day so it recurs annually. Year is informational only.
  -- (Postgres date type can't represent a recurring annual event natively.)
  month           smallint not null check (month between 1 and 12),
  day             smallint not null check (day between 1 and 31),
  -- Optional: birth year for age-based suggestions ("70-р ой" gift ideas)
  year            integer,
  -- Person nickname: "Ээж", "Эгч Сараа", "Хайрт"
  name            text not null,
  -- Standardized occasion enum-ish — also informs AI suggestion
  occasion        text not null check (occasion in (
    'birthday',
    'anniversary',
    'mothers_day',
    'fathers_day',
    'graduation',
    'just_because',
    'memorial',
    'other'
  )),
  -- AI-suggested bouquet product_id (cached so admin can see what's been recommended)
  ai_suggested_product_id text references public.products(id),
  -- Optional free-text note
  notes           text,
  -- Reminder cadence (multi-select via array)
  remind_days_before integer[] default '{7,1}',
  -- Suppression flags (Lucy's UX — opt out of sensitive dates)
  reminders_enabled boolean not null default true,
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_memory_dates_user on public.memory_dates(user_id);
-- Anniversary lookup index (find all dates matching today's month+day)
create index if not exists idx_memory_dates_month_day on public.memory_dates(month, day)
  where reminders_enabled;

-- updated_at trigger
drop trigger if exists trg_memory_dates_updated_at on public.memory_dates;
create trigger trg_memory_dates_updated_at
  before update on public.memory_dates
  for each row execute function public.set_updated_at();

-- RLS
alter table public.memory_dates enable row level security;

drop policy if exists "memory_owner_all" on public.memory_dates;
create policy "memory_owner_all" on public.memory_dates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin read access (for customer detail view)
drop policy if exists "memory_admin_read" on public.memory_dates;
create policy "memory_admin_read" on public.memory_dates
  for select using (public.is_admin());

-- ============================================================
-- View: upcoming_memory_dates
-- Lists all enabled dates whose next occurrence falls within `lookahead_days`.
-- Used by both customer's calendar view and the reminder cron.
-- ============================================================
create or replace function public.upcoming_memory_dates(
  lookahead_days integer default 30
)
returns table (
  id bigint,
  user_id uuid,
  occasion text,
  name text,
  notes text,
  ai_suggested_product_id text,
  next_occurrence date,
  days_until integer
)
language sql
stable
security definer
set search_path = public
as $$
  with todays_year as (
    select extract(year from current_date)::int as y
  ),
  next_occurrence as (
    select
      md.id,
      md.user_id,
      md.occasion,
      md.name,
      md.notes,
      md.ai_suggested_product_id,
      md.month,
      md.day,
      -- Pick this year if not yet passed, else next year
      case
        when make_date(ty.y, md.month, md.day) >= current_date
          then make_date(ty.y, md.month, md.day)
        else make_date(ty.y + 1, md.month, md.day)
      end as next_occ
    from public.memory_dates md, todays_year ty
    where md.reminders_enabled
  )
  select
    n.id,
    n.user_id,
    n.occasion,
    n.name,
    n.notes,
    n.ai_suggested_product_id,
    n.next_occ as next_occurrence,
    (n.next_occ - current_date)::int as days_until
  from next_occurrence n
  where (n.next_occ - current_date) <= lookahead_days
  order by next_occ;
$$;

grant execute on function public.upcoming_memory_dates(integer) to authenticated;
