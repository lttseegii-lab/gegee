import { describe, it, expect } from 'vitest';
import { getTier, getNextTier } from './tiers';

describe('getTier boundaries (must match user_rewards.tier generated column)', () => {
  it('maps spend to the right tier at each threshold', () => {
    expect(getTier(0).key).toBe('Petal');
    expect(getTier(499_999).key).toBe('Petal');
    expect(getTier(500_000).key).toBe('Stem');
    expect(getTier(1_499_999).key).toBe('Stem');
    expect(getTier(1_500_000).key).toBe('Garden');
    expect(getTier(4_999_999).key).toBe('Garden');
    expect(getTier(5_000_000).key).toBe('Atelier');
    expect(getTier(50_000_000).key).toBe('Atelier');
  });

  it('floors at Petal for zero/negative spend', () => {
    expect(getTier(-100).key).toBe('Petal');
  });
});

describe('getNextTier', () => {
  it('returns the following tier', () => {
    expect(getNextTier('Petal')?.key).toBe('Stem');
    expect(getNextTier('Garden')?.key).toBe('Atelier');
  });

  it('returns null at the top tier or for unknown keys', () => {
    expect(getNextTier('Atelier')).toBeNull();
    expect(getNextTier('nope')).toBeNull();
  });
});
