-- ============================================================
-- 0022 — order-photos bucket goes PRIVATE (audit finding 1D)
-- ============================================================
-- Idempotent. prep_photo_url / delivery_photo_url can reveal a recipient's
-- door/identity (surprise gifts especially). The bucket was public + anon-
-- readable, so anyone who guessed an object path could fetch any customer's
-- delivery photo. Reads now go through short-lived signed URLs minted server-
-- side (apps/web/lib/storage/orderPhotos.ts) after the page verifies ownership
-- (customer) or admin. Uploads remain admin-only (policy from 0020).
-- ============================================================

update storage.buckets set public = false where id = 'order-photos';

drop policy if exists "order-photos public read" on storage.objects;
