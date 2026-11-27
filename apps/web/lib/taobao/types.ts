// Shared types + category config for the Taobao import feature.

export const TAOBAO_CATEGORIES = ['bedding', 'duvet', 'pillow', 'robe', 'towel'] as const;
export type TaobaoCategory = (typeof TAOBAO_CATEGORIES)[number];

export const TAOBAO_CATEGORY_LABELS: Record<TaobaoCategory, string> = {
  bedding: 'Цагаан хэрэглэл',
  duvet: 'Хөнжил',
  pillow: 'Дэр',
  robe: 'Халад',
  towel: 'Алчуур',
};

/** Tag every imported product carries, so the catalog can group them. */
export const TAOBAO_BASE_TAG = 'home-textile';

export function isTaobaoCategory(value: unknown): value is TaobaoCategory {
  return typeof value === 'string' && (TAOBAO_CATEGORIES as readonly string[]).includes(value);
}

/** A listing as returned by a provider's search. Chinese, untranslated. */
export interface TaobaoItem {
  itemId: string;
  category: TaobaoCategory;
  titleZh: string;
  priceCny: number;
  sales: number;
  shop: string;
  attrsZh: string[];
  skusZh: string[];
  url: string | null;
  image: string | null;
  /** True for fabricated demo listings — these can never be published. */
  sample: boolean;
}

export interface TaobaoTranslation {
  itemId: string;
  name: string;
  description: string;
  details: string[];
  variants: string[];
}

export interface TaobaoProvider {
  id: string;
  label: string;
  sample: boolean;
  search(input: { category: TaobaoCategory; query: string }): Promise<TaobaoItem[]>;
}

export interface TaobaoPricing {
  /** MNT per 1 CNY */
  cnyRate: number;
  /** Markup on landed cost, percent */
  marginPercent: number;
  /** Cargo per item, MNT */
  cargoFee: number;
}
