-- ============================================================
-- Order trust photos — Supabase Storage bucket + policies
-- ============================================================
-- prep_photo  → florist бүтээсэн баглааны зураг
-- delivery_photo → курьер хүлээлгэн өгөх үед буулгасан зураг
-- Public read so the customer order detail page can use a CDN URL.
-- Admin (service_role) writes via the dashboard UI.

insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', true)
on conflict (id) do update set public = excluded.public;

-- Public read for the bucket (covers customer-facing order page)
do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'order-photos' and name = 'order-photos public read'
  ) then
    create policy "order-photos public read"
      on storage.objects for select
      using (bucket_id = 'order-photos');
  end if;
exception when undefined_table then null;
end$$;

-- Authenticated upload (admin check is enforced in our server actions via is_admin())
do $$
begin
  if not exists (
    select 1 from storage.policies
    where bucket_id = 'order-photos' and name = 'order-photos authenticated write'
  ) then
    create policy "order-photos authenticated write"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'order-photos');
  end if;
exception when undefined_table then null;
end$$;
