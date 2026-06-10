import { describe, it, expect } from 'vitest';
import { ubDateString } from './ub';

describe('ubDateString (Asia/Ulaanbaatar, UTC+8)', () => {
  it('keeps the calendar day during UTC+8 daytime', () => {
    // 04:00 UTC → 12:00 UB → same day
    expect(ubDateString(new Date('2026-06-10T04:00:00Z'))).toBe('2026-06-10');
  });

  it('rolls to the next day in the evening — the bug toISOString had', () => {
    // 17:00 UTC → 01:00 UB next day
    expect(ubDateString(new Date('2026-06-10T17:00:00Z'))).toBe('2026-06-11');
    // The old UTC-based code would have (wrongly) returned the previous day:
    expect(new Date('2026-06-10T17:00:00Z').toISOString().slice(0, 10)).toBe(
      '2026-06-10'
    );
  });

  it('formats as YYYY-MM-DD', () => {
    expect(ubDateString(new Date('2026-01-05T00:00:00Z'))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });
});
