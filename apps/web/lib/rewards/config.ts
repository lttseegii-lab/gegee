// ============================================================
// Rewards config — admin-editable knobs stored in site_settings
// ============================================================
// Pure types + defaults + sanitizer. Safe to import from both server
// AND client components. Server-only reader lives in ./getConfig.ts.

export interface RewardsConfig {
  /** Points awarded the first time a user completes onboarding. */
  signupBonus: number;
}

export const DEFAULT_REWARDS_CONFIG: RewardsConfig = {
  signupBonus: 5000,
};

const MIN_BONUS = 0;
const MAX_BONUS = 100000;

export function sanitizeRewardsConfig(raw: unknown): RewardsConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_REWARDS_CONFIG;
  const obj = raw as Record<string, unknown>;
  const rawBonus = obj.signupBonus;
  let signupBonus = DEFAULT_REWARDS_CONFIG.signupBonus;
  if (typeof rawBonus === 'number' && Number.isFinite(rawBonus)) {
    signupBonus = Math.min(
      MAX_BONUS,
      Math.max(MIN_BONUS, Math.floor(rawBonus))
    );
  }
  return { signupBonus };
}
