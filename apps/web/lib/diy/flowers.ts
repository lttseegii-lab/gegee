// DIY flower catalog — hardcoded for MVP.
// Each flower has price per stem (₮) + AI prompt fragment.

export interface DiyFlower {
  key: string;
  name: string;
  emoji: string;
  /** Price per stem in MNT */
  price: number;
  /** Adjective + noun used to compose the AI bouquet prompt */
  promptFragment: string;
  /** Hex color used for swatch + dust */
  color: string;
}

export const DIY_FLOWERS: DiyFlower[] = [
  {
    key: 'peony',
    name: 'Пион',
    emoji: '🌸',
    price: 12000,
    promptFragment: 'pink peonies',
    color: '#f5c6d0',
  },
  {
    key: 'rose',
    name: 'Сарнай',
    emoji: '🌹',
    price: 8000,
    promptFragment: 'red garden roses',
    color: '#d34a52',
  },
  {
    key: 'white-rose',
    name: 'Цагаан сарнай',
    emoji: '🤍',
    price: 8000,
    promptFragment: 'white garden roses',
    color: '#fafafa',
  },
  {
    key: 'tulip',
    name: 'Цахилдаг',
    emoji: '🌷',
    price: 5000,
    promptFragment: 'yellow tulips',
    color: '#f4d35e',
  },
  {
    key: 'sunflower',
    name: 'Наран цэцэг',
    emoji: '🌻',
    price: 7000,
    promptFragment: 'sunflowers',
    color: '#f7c43c',
  },
  {
    key: 'lily',
    name: 'Сараана',
    emoji: '🪻',
    price: 9000,
    promptFragment: 'white calla lilies',
    color: '#e8e2c8',
  },
  {
    key: 'eucalyptus',
    name: 'Эвкалипт',
    emoji: '🌿',
    price: 3000,
    promptFragment: 'eucalyptus greenery',
    color: '#a4b89e',
  },
  {
    key: 'lavender',
    name: 'Лаванда',
    emoji: '💜',
    price: 4000,
    promptFragment: 'lavender stems',
    color: '#b389d0',
  },
  {
    key: 'baby-breath',
    name: 'Хүүхдийн амьсгал',
    emoji: '✨',
    price: 2500,
    promptFragment: 'baby breath',
    color: '#fefefe',
  },
  {
    key: 'ranunculus',
    name: 'Ранункулус',
    emoji: '🌼',
    price: 9000,
    promptFragment: 'peach ranunculus',
    color: '#f4b690',
  },
  {
    key: 'anemone',
    name: 'Анемон',
    emoji: '🖤',
    price: 11000,
    promptFragment: 'burgundy anemones',
    color: '#4a1f2a',
  },
  {
    key: 'carnation',
    name: 'Карнатин',
    emoji: '🌺',
    price: 4000,
    promptFragment: 'soft pink carnations',
    color: '#e6a3b1',
  },
];

export const DIY_FLOWERS_BY_KEY: Record<string, DiyFlower> = Object.fromEntries(
  DIY_FLOWERS.map((f) => [f.key, f])
);

export interface FlowerSelection {
  key: string;
  qty: number;
}

export function flowerSubtotal(selections: FlowerSelection[]): number {
  return selections.reduce((sum, s) => {
    const f = DIY_FLOWERS_BY_KEY[s.key];
    return sum + (f ? f.price * s.qty : 0);
  }, 0);
}

export function totalStems(selections: FlowerSelection[]): number {
  return selections.reduce((sum, s) => sum + s.qty, 0);
}
