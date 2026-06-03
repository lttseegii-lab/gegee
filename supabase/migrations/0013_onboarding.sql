-- ============================================================
-- Gegeen Phase 3 — User onboarding
-- ============================================================
-- After signup (or first OAuth login) a user is walked through a
-- short flow: pick a signature flower/mood + add Memory Garden
-- dates. They can skip any step. `onboarded_at` is set when they
-- complete or explicitly skip the flow, so we never re-prompt them.

alter table public.profiles
  add column if not exists onboarded_at timestamptz,
  add column if not exists signature_mood text;

-- Index for the "is this user new?" check inside the auth callback.
create index if not exists idx_profiles_onboarded
  on public.profiles(onboarded_at)
  where onboarded_at is null;

-- Backfill existing users — they shouldn't be sent through onboarding now
-- that we're adding it. Only brand-new signups (created after this migration)
-- should see it.
update public.profiles
set onboarded_at = coalesce(joined_at, now())
where onboarded_at is null;
