// Server-side reader for the admin-editable rewards config.
// Kept separate from ./config.ts so the pure types/defaults file can
// be imported from client components without dragging in next/headers.
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_REWARDS_CONFIG,
  sanitizeRewardsConfig,
  type RewardsConfig,
} from './config';

export async function getRewardsConfig(): Promise<RewardsConfig> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'rewards_config')
      .maybeSingle();
    if (!data?.value) return DEFAULT_REWARDS_CONFIG;
    return sanitizeRewardsConfig(data.value);
  } catch {
    return DEFAULT_REWARDS_CONFIG;
  }
}
