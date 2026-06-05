// ============================================================
// Rewards config — admin-editable knobs stored in site_settings
// ============================================================
// Pure types + defaults + sanitizer. Safe to import from both server
// AND client components. Server-only reader lives in ./getConfig.ts.

export interface RewardsConfig {
  /** Points awarded the first time a user completes onboarding. */
  signupBonus: number;
  /**
   * Percentage of each paid order that becomes loyalty points.
   * e.g. 3 means a 100,000₮ order earns 3,000 points.
   */
  earnRatePercent: number;
}

export const DEFAULT_REWARDS_CONFIG: RewardsConfig = {
  signupBonus: 5000,
  earnRatePercent: 3,
};

const MIN_BONUS = 0;
const MAX_BONUS = 100000;
const MIN_RATE = 0;
const MAX_RATE = 100;

export function sanitizeRewardsConfig(raw: unknown): RewardsConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_REWARDS_CONFIG;
  const obj = raw as Record<string, unknown>;

  let signupBonus = DEFAULT_REWARDS_CONFIG.signupBonus;
  if (typeof obj.signupBonus === 'number' && Number.isFinite(obj.signupBonus)) {
    signupBonus = Math.min(
      MAX_BONUS,
      Math.max(MIN_BONUS, Math.floor(obj.signupBonus))
    );
  }

  let earnRatePercent = DEFAULT_REWARDS_CONFIG.earnRatePercent;
  if (
    typeof obj.earnRatePercent === 'number' &&
    Number.isFinite(obj.earnRatePercent)
  ) {
    earnRatePercent = Math.min(
      MAX_RATE,
      Math.max(MIN_RATE, Math.round(obj.earnRatePercent * 100) / 100)
    );
  }

  return { signupBonus, earnRatePercent };
}
