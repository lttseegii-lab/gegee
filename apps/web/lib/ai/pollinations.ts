/**
 * Pollinations.ai image URL builder
 * Free AI image generation — deterministic via seed.
 *
 * Phase 2: replace with build-time cache pattern (image stored in Supabase Storage,
 * `products.img_url` set to CDN URL). For now, used as a fallback only.
 */

export function aiImageUrl(
  prompt: string,
  seed: number,
  width: number = 600,
  height: number = 600
): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&enhance=true`;
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
