-- ============================================================
-- Gegeen — Defer the welcome bonus until onboarding completes
-- ============================================================
-- Previously `handle_new_user_rewards` awarded a hard-coded 250-point
-- welcome bonus the instant an auth.users row was created (i.e. the moment
-- someone authenticated with Google/email) — BEFORE they finished the
-- onboarding flow. That left abandoned signups looking like fully
-- "registered" accounts, complete with points and a join date.
--
-- It also double-awarded: finishOnboarding() ALSO grants the
-- admin-configurable signup bonus on first completion, so a user who DID
-- finish received 250 (trigger) + signupBonus (app) = two welcome bonuses.
--
-- Fix: the trigger now only initializes an empty user_rewards row (0 pts).
-- The single welcome bonus is granted exactly once — by finishOnboarding()
-- — when the user actually completes registration. The amount is controlled
-- by the admin `signupBonus` setting (/admin/rewards).

create or replace function public.handle_new_user_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Initialize an empty rewards row only. No welcome bonus is granted here:
  -- it is awarded on onboarding completion (see app finishOnboarding()).
  insert into public.user_rewards (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger `on_auth_user_created_rewards` already points at this function
-- (created in 0006_rewards.sql); replacing the function body is sufficient.
