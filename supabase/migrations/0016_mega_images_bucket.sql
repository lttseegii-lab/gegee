-- ============================================================
-- Gegeen Phase 3 — Mega menu image uploads
-- ============================================================
-- Admin can upload real photos for the mega menu image cards
-- (same pattern as 0014 hero-banners). Public read so the
-- customer header can deliver via CDN URL.

insert into storage.buckets (id, name, public)
values ('mega-images', 'mega-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'mega-images' and name = 'mega-images public read'
  ) then
    create policy "mega-images public read"
      on storage.objects for select
      using (bucket_id = 'mega-images');
  end if;
exception when undefined_table then null;
end$$;

do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'mega-images' and name = 'mega-images authenticated write'
  ) then
    create policy "mega-images authenticated write"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'mega-images');
  end if;
exception when undefined_table then null;
end$$;
