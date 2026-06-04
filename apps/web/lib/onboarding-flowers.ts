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
