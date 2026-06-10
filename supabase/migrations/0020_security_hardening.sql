-- ============================================================
-- 0020 — Security hardening (audit remediation, phase 1 + part of 2)
-- ============================================================
-- Idempotent: safe to re-run (drop ... if exists / create or replace / revoke).
-- Covers audit findings:
--   1A  profiles.role privilege escalation
--   1C  SECURITY DEFINER cross-user data leaks (deliveries, memory dates)
--   2D  storage buckets: any authenticated user could upload
--   2B  signup bonus TOCTOU (atomic claim function)
--   4F  qpay_token defense-in-depth revoke
-- NOTE: order-photos READ privacy (1D) and the order-creation RPC + capacity
--       model (1B/2C) ship in 0021 so they can land with their app changes.
-- ============================================================


-- ───────────────────────────────────────────────────────────
-- 1A. Block privilege escalation: a normal user must not be able to set
--     their own profiles.role = 'admin'.
--
-- A column-level `REVOKE UPDATE (role)` is NOT reliable here: Supabase grants
-- table-level UPDATE to `authenticated`, which overrides column grants. A
-- BEFORE UPDATE trigger is the robust mechanism and needs no column accounting.
-- The `auth.uid() is not null` guard lets service_role / SQL console (where
-- auth.uid() is null) still assign roles, so admin provisioning keeps working.
-- ───────────────────────────────────────────────────────────
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Permission denied: cannot change role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();


-- ───────────────────────────────────────────────────────────
-- 1C. SECURITY DEFINER functions were leaking every user's rows because they
--     bypass RLS and were granted to `authenticated` with no authz inside.
-- ───────────────────────────────────────────────────────────

-- todays_deliveries(): admin-only dispatch view. Re-create as plpgsql so we can
-- gate it with is_admin() (was language sql, callable by any authenticated user
-- and returning every recipient's name/phone/total/surprise flag).
create or replace function public.todays_deliveries()
returns table (
  id              bigint,
  order_code      text,
  customer_name   text,
  recipient_phone text,
  delivery_slot   text,
  total           integer,
  status          order_status,
  is_surprise     boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Permission denied';
  end if;

  return query
    select
      o.id,
      o.order_code,
      p.name as customer_name,
      o.recipient_phone,
      o.delivery_slot,
      o.total,
      o.status,
      o.is_surprise
    from public.orders o
    left join public.profiles p on p.id = o.user_id
    where o.delivery_date = (now() at time zone 'Asia/Ulaanbaatar')::date
      and o.status in ('paid','preparing','shipped')
    order by
      case o.delivery_slot
        when 'asap'  then 0
        when '10-13' then 1
        when '14-17' then 2
        when '18-21' then 3
        else 4
      end,
      o.id;
end;
$$;

-- upcoming_memory_dates(): the customer's own calendar. Add the missing
-- auth.uid() ownership filter so it can no longer dump every user's people,
-- notes and occasions. (Re-stated in full to keep the migration self-contained.)
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
      case
        when make_date(ty.y, md.month, md.day) >= current_date
          then make_date(ty.y, md.month, md.day)
        else make_date(ty.y + 1, md.month, md.day)
      end as next_occ
    from public.memory_dates md, todays_year ty
    where md.reminders_enabled
      and md.user_id = auth.uid()      -- ← ownership filter (was missing)
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


-- ───────────────────────────────────────────────────────────
-- 2D. Storage buckets: the write policies granted INSERT to ANY authenticated
--     user, so a normal customer could upload via the Storage API directly and
--     bypass the admin-only server actions. Gate every write on is_admin().
--     (Admins still upload fine; their JWT resolves is_admin() = true.)
-- ───────────────────────────────────────────────────────────
drop policy if exists "hero-banners authenticated write" on storage.objects;
drop policy if exists "hero-banners admin write" on storage.objects;
create policy "hero-banners admin write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hero-banners' and public.is_admin());

drop policy if exists "mega-images authenticated write" on storage.objects;
drop policy if exists "mega-images admin write" on storage.objects;
create policy "mega-images admin write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mega-images' and public.is_admin());

drop policy if exists "order-photos authenticated write" on storage.objects;
drop policy if exists "order-photos admin write" on storage.objects;
create policy "order-photos admin write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'order-photos' and public.is_admin());


-- ───────────────────────────────────────────────────────────
-- 4F. Defense-in-depth: the QPay bearer-token cache is service_role-only by RLS
--     (no policies), but also strip the table from the public API surface.
-- ───────────────────────────────────────────────────────────
revoke all on public.qpay_token from anon, authenticated;


-- ───────────────────────────────────────────────────────────
-- 2B. Signup/welcome bonus was granted by a read-check-write in the app
--     (finishOnboarding), which is a TOCTOU race: N concurrent calls each read
--     onboarded_at = null and each grant a bonus. Move the claim into one
--     atomic SECURITY DEFINER function. The `update ... where onboarded_at is
--     null` row-lock serializes concurrent callers, so the bonus is granted at
--     most once. Returns the points awarded (0 if already claimed).
-- ───────────────────────────────────────────────────────────
create or replace function public.claim_signup_bonus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_bonus integer;
  v_done  boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Atomically claim the one-time onboarding completion. Only the call that
  -- flips onboarded_at from null gets a row back; everyone else exits with 0.
  update public.profiles
    set onboarded_at = now()
    where id = v_uid and onboarded_at is null;
  if not found then
    return 0;
  end if;

  -- Mirror sanitizeRewardsConfig: default 5000, clamp [0, 100000].
  v_bonus := coalesce(
    (select greatest(0, least(100000, floor((value->>'signupBonus')::numeric)::int))
       from public.site_settings
      where key = 'rewards_config'),
    5000
  );

  if v_bonus > 0 then
    insert into public.rewards_ledger (user_id, points, reason)
      values (v_uid, v_bonus, 'Бүртгэл дуусгасан баяр — тавтай морил');

    insert into public.user_rewards (user_id, total_points)
      values (v_uid, v_bonus)
      on conflict (user_id) do update
        set total_points = public.user_rewards.total_points + v_bonus;

    v_done := true;
  end if;

  return case when v_done then v_bonus else 0 end;
end;
$$;

grant execute on function public.claim_signup_bonus() to authenticated;
