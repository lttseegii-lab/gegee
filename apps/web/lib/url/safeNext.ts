/**
 * Sanitize a post-auth `next` redirect target.
 *
 * Returns `next` only when it is a safe, same-origin RELATIVE path. A bare
 * `startsWith('/')` check is not enough: `//evil.com` and `/\evil.com` start
 * with a slash yet `redirect()` / `router.push()` treat them as protocol-
 * relative URLs and send the browser to an external origin (open redirect).
 *
 * Pure module — safe to import from server and client.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = '/'
): string {
  if (!next || typeof next !== 'string') return fallback;
  if (!next.startsWith('/')) return fallback;
  // Reject protocol-relative ("//host") and backslash ("/\host") forms.
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
