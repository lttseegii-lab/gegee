// OAuth providers config — update flags below when you configure providers
// in Supabase Dashboard → Authentication → Providers.

export const OAUTH_PROVIDERS = {
  google: true, // Configured 2026-05-22 with Google Cloud OAuth Client
  facebook: false, // Set true after Facebook OAuth credentials configured
} as const;

export const ANY_OAUTH_ENABLED =
  OAUTH_PROVIDERS.google || OAUTH_PROVIDERS.facebook;
