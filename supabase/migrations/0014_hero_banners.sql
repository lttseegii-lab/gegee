-- ============================================================
-- Gegeen Phase 3 — Homepage hero carousel
-- ============================================================
-- Admin-editable rotating hero banner. Each slide has an image,
-- heading, and subheading. Stored as JSON under site_settings.
-- Images can be either external URLs or uploads to the hero-banners
-- storage bucket (public read, authenticated write — admin check
-- enforced inside the server action).

-- ───── Storage bucket ─────
insert into storage.buckets (id, name, public)
values ('hero-banners', 'hero-banners', true)
on conflict (id) do update set public = excluded.public;

-- Public read so the homepage can deliver via CDN URL
do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'hero-banners' and name = 'hero-banners public read'
  ) then
    create policy "hero-banners public read"
      on storage.objects for select
      using (bucket_id = 'hero-banners');
  end if;
exception when undefined_table then null;
end$$;

-- Authenticated upload — server action enforces is_admin() before allowing
do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'hero-banners' and name = 'hero-banners authenticated write'
  ) then
    create policy "hero-banners authenticated write"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'hero-banners');
  end if;
exception when undefined_table then null;
end$$;

-- ───── Seed default hero banners ─────
-- Match the current static hero (single slide) so the visual stays
-- consistent until admin uploads real photos.
insert into public.site_settings (key, value) values (
  'hero_banners',
  '{
    "slides": [
      {
        "image_url": "",
        "heading": "Цэцэг илгээ. Урлагийг задал.",
        "subheading": "AI чиний хайр, баяр, талархлыг ойлгож хамгийн тохирох цэцгийг сонгож өгнө. Letterbox-аас атриум хүртэл."
      }
    ],
    "interval_ms": 6000
  }'::jsonb
)
on conflict (key) do nothing;
