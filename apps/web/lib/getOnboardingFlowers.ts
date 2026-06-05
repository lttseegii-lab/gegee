// Server-only reader for onboarding flowers.
// Kept in its own file so the pure defaults (onboarding-flowers.ts) can be
// imported from client components without pulling in next/headers.

import { createClient } from '@/lib/supabase/server';
import {
  ONBOARDING_FLOWERS,
  mergeFlowerOverrides,
  sanitizeOnboardingFlowersOverride,
  type OnboardingFlower,
  type OnboardingFlowersOverride,
} from './onboarding-flowers';

/**
 * Returns the merged onboarding flower list — admin overrides applied on top
 * of the static defaults. Never returns null; falls back to defaults on any
 * failure or missing setting.
 */
export async function getOnboardingFlowers(): Promise<OnboardingFlower[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'onboarding_flowers')
      .maybeSingle();
    if (!data?.value) return ONBOARDING_FLOWERS;
    const override = sanitizeOnboardingFlowersOverride(data.value);
    return mergeFlowerOverrides(ONBOARDING_FLOWERS, override);
  } catch {
    return ONBOARDING_FLOWERS;
  }
}

/**
 * Look up one flower by its stored key, with admin overrides applied.
 * Used by ProfileShell / UserMenu to render avatars with the admin's photos.
 * Returns null if the key isn't recognised.
 */
export async function getOnboardingFlowerByKey(
  key: string | null | undefined
): Promise<OnboardingFlower | null> {
  if (!key) return null;
  const flowers = await getOnboardingFlowers();
  return flowers.find((f) => f.key === key) ?? null;
}

/** Lower-level: read the raw override array (for the admin editor). */
export async function getOnboardingFlowersOverride(): Promise<OnboardingFlowersOverride> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'onboarding_flowers')
      .maybeSingle();
    if (!data?.value) return [];
    return sanitizeOnboardingFlowersOverride(data.value);
  } catch {
    return [];
  }
}
