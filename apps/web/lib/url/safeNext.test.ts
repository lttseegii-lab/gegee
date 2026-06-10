import { describe, it, expect } from 'vitest';
import { safeNext } from './safeNext';

describe('safeNext', () => {
  it('allows same-origin relative paths', () => {
    expect(safeNext('/account/orders')).toBe('/account/orders');
    expect(safeNext('/')).toBe('/');
  });

  it('rejects protocol-relative and backslash open-redirect targets', () => {
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('/\\evil.com')).toBe('/');
  });

  it('rejects absolute URLs and bare hosts', () => {
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('evil.com')).toBe('/');
  });

  it('falls back for empty / nullish input', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext(undefined)).toBe('/');
    expect(safeNext('')).toBe('/');
  });

  it('honors a custom fallback', () => {
    expect(safeNext(null, '/account/profile')).toBe('/account/profile');
    expect(safeNext('//evil.com', '/account/profile')).toBe('/account/profile');
  });
});
