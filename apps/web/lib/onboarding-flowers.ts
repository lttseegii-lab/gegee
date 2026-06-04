// ============================================================
// Onboarding flower personalities
// ============================================================
// User picks ONE flower that best represents themselves. The key is
// stored in `profiles.signature_mood` (we reuse the column rather
// than adding a new one — the mood-vs-flower distinction is just a
// product framing change).
//
// Images are generated on-the-fly by Pollinations.ai with a stable
// seed so each flower stays visually consistent across renders.

import { aiImageUrl } from '@/lib/ai/pollinations';

export interface OnboardingFlower {
  /** Stored value */
  key: string;
  /** Mongolian flower name */
  label: string;
  /** Short personality description */
  description: string;
  /** Pollinations.ai prompt */
  prompt: string;
  /** Seed for image determinism */
  seed: number;
  /** Soft tint behind the photo while loading */
  tintClass: string;
}

export const ONBOARDING_FLOWERS: OnboardingFlower[] = [
  {
    key: 'rose',
    label: 'Сарнай',
    description: 'Хайр, нандин романтик',
    prompt:
      'a single fresh red rose, soft natural light, minimalist studio background, photorealistic, high detail',
    seed: 10001,
    tintClass: 'bg-pinkHot/10',
  },
  {
    key: 'peony',
    label: 'Пион',
    description: 'Эмзэг, тансаг гоо сайхан',
    prompt:
      'a single coral pink peony in full bloom, soft daylight, clean studio background, photorealistic',
    seed: 10002,
    tintClass: 'bg-blush',
  },
  {
    key: 'tulip',
    label: 'Цахилдаг',
    description: 'Урам зориг, найрсаг',
    prompt:
      'a single yellow tulip, fresh, soft natural light, minimalist background, photorealistic',
    seed: 10003,
    tintClass: 'bg-yellow-pale',
  },
  {
    key: 'lily',
    label: 'Сараана',
    description: 'Цэвэр ариун, тайван',
    prompt:
      'a single elegant white lily flower, soft natural light, minimalist background, photorealistic',
    seed: 10004,
    tintClass: 'bg-offwhite',
  },
  {
    key: 'sunflower',
    label: 'Наран цэцэг',
    description: 'Баяр, гэрэлтэй сэтгэл',
    prompt:
      'a single bright yellow sunflower with green leaves, sunny daylight, clean background, photorealistic',
    seed: 10005,
    tintClass: 'bg-yellow-pale',
  },
  {
    key: 'daisy',
    label: 'Эх дагина',
    description: 'Цэвэр, дур булаам, гэнэн',
    prompt:
      'a single white daisy flower with yellow center, soft daylight, minimalist background, photorealistic',
    seed: 10006,
    tintClass: 'bg-offwhite',
  },
  {
    key: 'orchid',
    label: 'Орхид',
    description: 'Тансаг, нандин, ховор',
    prompt:
      'a single purple orchid flower, elegant, soft studio light, minimalist background, photorealistic',
    seed: 10007,
    tintClass: 'bg-purpleSoft/40',
  },
  {
    key: 'lavender',
    label: 'Лаванда',
    description: 'Тайван, гүн бодолтой',
    prompt:
      'a small bunch of fresh lavender stems with purple buds, soft daylight, minimalist background, photorealistic',
    seed: 10008,
    tintClass: 'bg-lilac',
  },
  {
    key: 'cherry-blossom',
    label: 'Алимны цэцэг',
    description: 'Хаврын шинэлэг найдвар',
    prompt:
      'a single delicate pink cherry blossom branch, soft daylight, clean white background, photorealistic',
    seed: 10009,
    tintClass: 'bg-blush',
  },
  {
    key: 'eucalyptus',
    label: 'Эвкалипт',
    description: 'Тэнцвэртэй, байгальтай ойр',
    prompt:
      'a single eucalyptus stem with silver green leaves, fresh, soft daylight, minimalist background, photorealistic',
    seed: 10010,
    tintClass: 'bg-mint',
  },
];

export const ONBOARDING_FLOWERS_BY_KEY: Record<string, OnboardingFlower> =
  Object.fromEntries(ONBOARDING_FLOWERS.map((f) => [f.key, f]));

export function flowerImageUrl(
  flower: OnboardingFlower,
  size = 400
): string {
  return aiImageUrl(flower.prompt, flower.seed, size, size);
}
