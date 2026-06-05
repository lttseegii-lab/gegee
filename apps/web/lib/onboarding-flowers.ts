// ============================================================
// Onboarding flower personalities
// ============================================================
// User picks ONE flower that best represents themselves. The key is
// stored in `profiles.signature_mood` (we reuse the column rather
// than adding a new one — the mood-vs-flower distinction is just a
// product framing change).
//
// Images are real photographs sourced from Unsplash CDN. Each URL
// is a stable photo ID with Unsplash's auto-format/quality params
// so the dev experience stays fast and the photos look real (no
// AI-generated images).

export interface OnboardingFlower {
  /** Stored value */
  key: string;
  /** Mongolian flower name */
  label: string;
  /** Short personality description */
  description: string;
  /** Public photo URL (Unsplash CDN by default — admin can swap later) */
  image_url: string;
  /** Fallback emoji shown if the photo fails to load */
  emoji: string;
  /** Soft tint behind the photo while loading */
  tintClass: string;
}

// Width hint appended to Unsplash URLs for responsive delivery
const UNSPLASH_PARAMS = 'w=600&h=600&fit=crop&auto=format&q=75';

function u(id: string): string {
  return `https://images.unsplash.com/photo-${id}?${UNSPLASH_PARAMS}`;
}

export const ONBOARDING_FLOWERS: OnboardingFlower[] = [
  {
    key: 'rose',
    label: 'Сарнай',
    description: 'Хайр, нандин романтик',
    image_url: u('1496062031456-07b8f162a322'),
    emoji: '🌹',
    tintClass: 'bg-pinkHot/10',
  },
  {
    key: 'peony',
    label: 'Пион',
    description: 'Эмзэг, тансаг гоо сайхан',
    image_url: u('1591886960571-74d43a9d4166'),
    emoji: '🌸',
    tintClass: 'bg-blush',
  },
  {
    key: 'tulip',
    label: 'Цахилдаг',
    description: 'Урам зориг, найрсаг',
    image_url: u('1490750967868-88aa4486c946'),
    emoji: '🌷',
    tintClass: 'bg-yellow-pale',
  },
  {
    key: 'lily',
    label: 'Сараана',
    description: 'Цэвэр ариун, тайван',
    image_url: u('1561181286-d3fee7d55364'),
    emoji: '🪷',
    tintClass: 'bg-offwhite',
  },
  {
    key: 'sunflower',
    label: 'Наран цэцэг',
    description: 'Баяр, гэрэлтэй сэтгэл',
    image_url: u('1470509037663-253afd7f0f51'),
    emoji: '🌻',
    tintClass: 'bg-yellow-pale',
  },
  {
    key: 'daisy',
    label: 'Эх дагина',
    description: 'Цэвэр, дур булаам, гэнэн',
    image_url: u('1454179083322-198bb4daae41'),
    emoji: '🌼',
    tintClass: 'bg-offwhite',
  },
  {
    key: 'orchid',
    label: 'Орхид',
    description: 'Тансаг, нандин, ховор',
    image_url: u('1567696911980-2eed69a46042'),
    emoji: '🌺',
    tintClass: 'bg-purpleSoft/40',
  },
  {
    key: 'lavender',
    label: 'Лаванда',
    description: 'Тайван, гүн бодолтой',
    image_url: u('1499002238440-d264edd596ec'),
    emoji: '💜',
    tintClass: 'bg-lilac',
  },
  {
    key: 'cherry-blossom',
    label: 'Алимны цэцэг',
    description: 'Хаврын шинэлэг найдвар',
    image_url: u('1522748906645-95d8adfd52c7'),
    emoji: '🌸',
    tintClass: 'bg-blush',
  },
  {
    key: 'eucalyptus',
    label: 'Эвкалипт',
    description: 'Тэнцвэртэй, байгальтай ойр',
    image_url: u('1487530811176-3780de880c2d'),
    emoji: '🌿',
    tintClass: 'bg-mint',
  },
];

export const ONBOARDING_FLOWERS_BY_KEY: Record<string, OnboardingFlower> =
  Object.fromEntries(ONBOARDING_FLOWERS.map((f) => [f.key, f]));

export const ONBOARDING_FLOWER_KEYS = ONBOARDING_FLOWERS.map((f) => f.key);

/**
 * Schema for an admin override of a single flower. Only the editable
 * fields (image, label, description) are stored — `key`, `emoji`,
 * `tintClass` always come from the static defaults so the avatars and
 * tint styles stay consistent.
 */
export interface OnboardingFlowerOverride {
  key: string;
  image_url?: string;
  label?: string;
  description?: string;
}

export type OnboardingFlowersOverride = OnboardingFlowerOverride[];

/**
 * Merge an admin override (from site_settings.onboarding_flowers) on top of
 * the static defaults. Keys are matched 1:1 — anything missing falls back to
 * the default value. Used by the server reader so the rest of the codebase
 * always sees a complete OnboardingFlower[].
 */
export function mergeFlowerOverrides(
  defaults: OnboardingFlower[],
  override: OnboardingFlowersOverride | null | undefined
): OnboardingFlower[] {
  if (!override || override.length === 0) return defaults;
  const map = new Map(override.map((o) => [o.key, o] as const));
  return defaults.map((f) => {
    const o = map.get(f.key);
    if (!o) return f;
    return {
      ...f,
      image_url:
        typeof o.image_url === 'string' && o.image_url.trim()
          ? o.image_url.trim()
          : f.image_url,
      label:
        typeof o.label === 'string' && o.label.trim()
          ? o.label.trim()
          : f.label,
      description:
        typeof o.description === 'string' && o.description.trim()
          ? o.description.trim()
          : f.description,
    };
  });
}

export function sanitizeOnboardingFlowersOverride(
  raw: unknown
): OnboardingFlowersOverride {
  if (!Array.isArray(raw)) return [];
  const validKeys = new Set(ONBOARDING_FLOWER_KEYS);
  const out: OnboardingFlowersOverride = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const key = typeof obj.key === 'string' ? obj.key.trim() : '';
    if (!validKeys.has(key)) continue;
    const image_url_raw =
      typeof obj.image_url === 'string' ? obj.image_url.trim() : '';
    const image_url =
      image_url_raw &&
      (image_url_raw.startsWith('http://') ||
        image_url_raw.startsWith('https://'))
        ? image_url_raw.slice(0, 500)
        : undefined;
    const label =
      typeof obj.label === 'string'
        ? obj.label.trim().slice(0, 40) || undefined
        : undefined;
    const description =
      typeof obj.description === 'string'
        ? obj.description.trim().slice(0, 200) || undefined
        : undefined;
    out.push({ key, image_url, label, description });
  }
  return out;
}
