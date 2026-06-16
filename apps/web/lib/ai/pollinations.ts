/**
 * Pollinations.ai image URL builder
 * Free AI image generation — deterministic via seed.
 *
 * Phase 2: replace with build-time cache pattern (image stored in Supabase Storage,
 * `products.img_url` set to CDN URL). For now, used as a fallback only.
 */

// One canonical Pollinations size for ALL consumers. Pollinations caches by the
// full URL (size included), so every distinct width/height was a separate, slow
// flux generation — only the catalog's 600×600 stayed warm, which is why cart /
// wishlist / order thumbnails (80/160/200) showed as broken. Images render
// `unoptimized` + object-cover, so the source resolution is decoupled from the
// displayed size; one shared size means one cached image reused everywhere.
const POLLINATIONS_SIZE = 600;

export function aiImageUrl(
  prompt: string,
  seed: number,
  _width: number = POLLINATIONS_SIZE,
  _height: number = POLLINATIONS_SIZE
): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${POLLINATIONS_SIZE}&height=${POLLINATIONS_SIZE}&seed=${seed}&nologo=true&model=flux&enhance=true`;
}

/**
 * Resolve product image URL — prefer cached `img_url` from DB,
 * fall back to runtime Pollinations.ai generation.
 */
export function productImageUrl(product: {
  img_url: string | null;
  img_prompt: string | null;
  img_seed: number | null;
}, width = 600, height = 600): string {
  if (product.img_url) return product.img_url;
  if (product.img_prompt && product.img_seed != null) {
    return aiImageUrl(product.img_prompt, product.img_seed, width, height);
  }
  return '/placeholder.png';
}

/**
 * Return up to `count` image URLs for a product.
 * CDN products return a single-element array (no gallery yet).
 * Pollinations products return `count` seed-varied URLs for the hover slider.
 */
export function productImageUrls(
  product: { img_url: string | null; img_prompt: string | null; img_seed: number | null },
  count = 4
): string[] {
  if (product.img_url) return [product.img_url];
  if (product.img_prompt && product.img_seed != null) {
    return Array.from({ length: count }, (_, i) =>
      aiImageUrl(product.img_prompt!, product.img_seed! + i)
    );
  }
  return ['/placeholder.png'];
}
