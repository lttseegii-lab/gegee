-- ============================================================
-- Gegeen Phase 2 — Site settings (theme customization, etc.)
-- ============================================================
-- Generic key-value store for admin-tunable site config. Phase 1 uses it for
-- menu_colors only. Future: footer copy, promo banner, default tier, etc.

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- RLS: everyone reads, only admin writes
alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed default menu_colors (matches the hardcoded MEGA_TABS config)
insert into public.site_settings (key, value) values
  ('menu_colors', '{
    "flowers": "blush",
    "plants": "mint",
    "gifts": "lilac",
    "cards": "purpleSoft",
    "subs": "peach"
  }'::jsonb)
on conflict (key) do nothing;
