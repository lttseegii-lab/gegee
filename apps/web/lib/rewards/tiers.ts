// Rewards tier definitions — must stay in sync with the
// 'tier' generated column in user_rewards (migration 0006_rewards.sql).

export interface RewardsTier {
  key: 'Petal' | 'Stem' | 'Garden' | 'Atelier';
  label: string;
  icon: string;
  minSpent: number;
  maxSpent: number | null;
  perks: string[];
  /** Earn multiplier (1 = base 1pt/1000₮, 2 = 2× points) */
  multiplier: number;
  color: string;
}

export const TIERS: RewardsTier[] = [
  {
    key: 'Petal',
    label: 'Petal',
    icon: '🌸',
    minSpent: 0,
    maxSpent: 500000,
    perks: [
      'Тавтай морилно уу bonus 250 оноо',
      '100K₮-аас дээш үнэгүй хүргэлт',
      '1 оноо / 1000₮ зарцуулсанд',
    ],
    multiplier: 1,
    color: 'pinkHot',
  },
  {
    key: 'Stem',
    label: 'Stem',
    icon: '🌿',
    minSpent: 500000,
    maxSpent: 1500000,
    perks: [
      'Бүх Petal давуу талууд',
      'Хүргэлт нэгдсэн үнэгүй (өргөтгөл)',
      'Заримдаа upgrade оноо нэмэгдэх',
    ],
    multiplier: 1.5,
    color: 'sageDeep',
  },
  {
    key: 'Garden',
    label: 'Garden',
    icon: '🌹',
    minSpent: 1500000,
    maxSpent: 5000000,
    perks: [
      'Бүх Stem давуу талууд',
      '2× оноо',
      'Priority concierge тусгай туслалцаа',
      'Дөрвөлжин угтуулга card',
    ],
    multiplier: 2,
    color: 'goldDeep',
  },
  {
    key: 'Atelier',
    label: 'Atelier',
    icon: '✻',
    minSpent: 5000000,
    maxSpent: null,
    perks: [
      'Бүх Garden давуу талууд',
      '3× оноо',
      'Couture series-ийн эхэн нэвтрэлт',
      'Private florist consultant',
      'Гар утсан дээрх тусгай дугаар',
    ],
    multiplier: 3,
    color: 'ink',
  },
];

export function getTier(spent: number): RewardsTier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (spent >= TIERS[i].minSpent) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(currentKey: string): RewardsTier | null {
  const idx = TIERS.findIndex((t) => t.key === currentKey);
  if (idx < 0 || idx === TIERS.length - 1) return null;
  return TIERS[idx + 1];
}
