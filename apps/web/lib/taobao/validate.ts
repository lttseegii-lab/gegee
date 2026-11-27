// Validation for everything the admin browser sends back to the server.
// Pure functions — no I/O — so they are unit tested.

import { isTaobaoCategory, TAOBAO_BASE_TAG, type TaobaoCategory } from './types';

const ITEM_ID = /^[A-Za-z0-9-]{1,40}$/;
const LISTING_URL = /^https:\/\/(?:item\.taobao\.com|detail\.tmall\.com)\/[\w\-./?=&%]{1,300}$/;
const IMAGE_URL = /^https:\/\/[a-z0-9.-]{1,80}\.(?:alicdn\.com|tbcdn\.cn)\/[\w\-./!%]{1,300}$/i;

export function isTaobaoImageUrl(value: unknown): value is string {
  return typeof value === 'string' && IMAGE_URL.test(value);
}

function lines(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .slice(0, maxItems)
    .map((v) => v.trim().slice(0, maxLength));
}

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length >= min && t.length <= max ? t : null;
}

function int(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
}

export interface TranslateRequestItem {
  itemId: string;
  titleZh: string;
  attrsZh: string[];
  skusZh: string[];
}

export function parseTranslateItem(input: unknown): TranslateRequestItem | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const titleZh = text(raw.titleZh, 1, 300);
  if (typeof raw.itemId !== 'string' || !ITEM_ID.test(raw.itemId) || !titleZh) return null;
  return { itemId: raw.itemId, titleZh, attrsZh: lines(raw.attrsZh, 30, 200), skusZh: lines(raw.skusZh, 40, 120) };
}

export interface ImportInput {
  productId: string;
  category: TaobaoCategory;
  name: string;
  description: string;
  details: string[];
  variants: string[];
  price: number;
  cost: number;
  active: boolean;
  tags: string[];
  source: {
    itemId: string;
    titleZh: string;
    priceCny: number;
    url: string | null;
    image: string | null;
    sample: boolean;
  };
}

export type ImportParse = { ok: true; value: ImportInput } | { ok: false; error: string };

export function parseImportInput(input: unknown): ImportParse {
  const fail = (error: string): ImportParse => ({ ok: false, error });
  if (!input || typeof input !== 'object') return fail('Хүсэлт буруу байна.');
  const raw = input as Record<string, unknown>;
  const src = (raw.source && typeof raw.source === 'object' ? raw.source : {}) as Record<string, unknown>;

  if (!isTaobaoCategory(raw.category)) return fail('Ангилал буруу байна.');
  if (typeof src.itemId !== 'string' || !ITEM_ID.test(src.itemId)) return fail('Taobao барааны дугаар буруу байна.');
  const titleZh = text(src.titleZh, 1, 300);
  if (!titleZh) return fail('Хятад гарчиг буруу байна.');
  const priceCny = typeof src.priceCny === 'number' && Number.isFinite(src.priceCny) ? src.priceCny : NaN;
  if (!(priceCny > 0 && priceCny <= 100_000)) return fail('Юанийн үнэ буруу байна.');

  const name = text(raw.name, 2, 80);
  if (!name) return fail('Барааны нэр 2–80 тэмдэгт байна.');
  const description = text(raw.description, 0, 180);
  if (description == null) return fail('Тайлбар 180 тэмдэгтээс хэтрэхгүй.');
  const price = int(raw.price, 1, 5_000_000);
  if (price == null) return fail('Зарах үнэ 1–5,000,000₮ хооронд бүхэл тоо байна.');
  const cost = int(raw.cost, 0, 5_000_000);
  if (cost == null) return fail('Өртөг 0–5,000,000₮ хооронд бүхэл тоо байна.');

  const sample = src.sample === true;
  return {
    ok: true,
    value: {
      productId: `tb-${src.itemId.toLowerCase()}`,
      category: raw.category,
      name,
      description,
      details: lines(raw.details, 8, 160),
      variants: lines(raw.variants, 20, 60),
      price,
      cost,
      // Fabricated demo listings must never reach customers.
      active: sample ? false : raw.active === true,
      tags: [TAOBAO_BASE_TAG, raw.category, ...(sample ? ['sample'] : [])],
      source: {
        itemId: src.itemId,
        titleZh,
        priceCny: Math.round(priceCny * 100) / 100,
        url: typeof src.url === 'string' && LISTING_URL.test(src.url) ? src.url : null,
        image: isTaobaoImageUrl(src.image) ? src.image : null,
        sample,
      },
    },
  };
}
