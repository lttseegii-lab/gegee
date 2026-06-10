import { createServiceClient } from '@/lib/supabase/server';

// Order fulfillment photos (prep / delivery) can show a recipient's door and
// identity — for surprise gifts especially. The bucket is private (migration
// 0022); reads go through short-lived signed URLs minted here after the page
// has already verified ownership (customer) or admin.

const BUCKET = 'order-photos';
const SIGN_TTL_SECONDS = 3600; // 1 hour

/**
 * Normalize a stored reference to its storage object key. New rows store the
 * bare key; older rows stored a full public URL — handle both so the bucket can
 * go private without a data migration.
 */
export function orderPhotoKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  return idx >= 0 ? value.slice(idx + marker.length) : value;
}

/**
 * Mint a short-lived signed URL for a private order photo. Returns null when
 * there is no photo or signing fails, so the caller simply renders nothing.
 */
export async function signOrderPhoto(
  value: string | null | undefined
): Promise<string | null> {
  const key = orderPhotoKey(value);
  if (!key) return null;
  try {
    const svc = createServiceClient();
    const { data, error } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(key, SIGN_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
