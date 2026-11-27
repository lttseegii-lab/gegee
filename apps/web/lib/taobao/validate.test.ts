import { describe, it, expect } from 'vitest';
import { parseImportInput, parseTranslateItem } from './validate';

const input = (changes: Record<string, unknown> = {}, source: Record<string, unknown> = {}) => ({
  category: 'duvet',
  name: 'Галууны өдөн хөнжил',
  description: 'Өвлийн дулаан хөнжил.',
  details: ['Хэмжээ: 200×230 см', '  ', 'Жин: 1200 г'],
  variants: ['Цагаан, 1000 г'],
  price: 590000,
  cost: 452500,
  active: true,
  ...changes,
  source: { itemId: 'A1B2', titleZh: '95白鹅绒羽绒被', priceCny: 899, url: null, image: null, sample: false, ...source },
});

describe('parseImportInput', () => {
  it('builds a product id, tags and cleaned lines', () => {
    const result = parseImportInput(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.productId).toBe('tb-a1b2');
    expect(result.value.tags).toEqual(['home-textile', 'duvet']);
    expect(result.value.details).toEqual(['Хэмжээ: 200×230 см', 'Жин: 1200 г']);
    expect(result.value.active).toBe(true);
  });

  it('forces sample listings inactive and tags them', () => {
    const result = parseImportInput(input({ active: true }, { itemId: 'SAMPLE-DUV-01', sample: true }));
    expect(result.ok && result.value.active).toBe(false);
    expect(result.ok && result.value.tags).toEqual(['home-textile', 'duvet', 'sample']);
  });

  it('keeps only Taobao listing and CDN image URLs', () => {
    const bad = parseImportInput(input({}, { url: 'javascript:alert(1)', image: 'https://evil.example/x.jpg' }));
    expect(bad.ok && bad.value.source.url).toBeNull();
    expect(bad.ok && bad.value.source.image).toBeNull();
    const good = parseImportInput(input({}, { url: 'https://item.taobao.com/item.htm?id=123', image: 'https://img.alicdn.com/imgextra/i1/abc.jpg' }));
    expect(good.ok && good.value.source.url).toBe('https://item.taobao.com/item.htm?id=123');
    expect(good.ok && good.value.source.image).toBe('https://img.alicdn.com/imgextra/i1/abc.jpg');
    const lookalike = parseImportInput(input({}, { image: 'https://img.alicdn.com.evil.example/x.jpg' }));
    expect(lookalike.ok && lookalike.value.source.image).toBeNull();
  });

  it('rejects bad categories, ids, prices and names', () => {
    expect(parseImportInput(null).ok).toBe(false);
    expect(parseImportInput(input({ category: 'flowers' })).ok).toBe(false);
    expect(parseImportInput(input({}, { itemId: '../x' })).ok).toBe(false);
    expect(parseImportInput(input({}, { priceCny: -5 })).ok).toBe(false);
    expect(parseImportInput(input({}, { priceCny: '899' })).ok).toBe(false);
    expect(parseImportInput(input({ name: 'x' })).ok).toBe(false);
    expect(parseImportInput(input({ price: 0 })).ok).toBe(false);
    expect(parseImportInput(input({ price: 1999.5 })).ok).toBe(false);
    expect(parseImportInput(input({ cost: -1 })).ok).toBe(false);
    expect(parseImportInput(input({ description: 'x'.repeat(181) })).ok).toBe(false);
  });
});

describe('parseTranslateItem', () => {
  it('bounds what gets sent to the translator', () => {
    const item = parseTranslateItem({ itemId: 'A1', titleZh: ' 全棉四件套 ', attrsZh: Array(50).fill('材质: 棉'), skusZh: ['白色', 7, ''] });
    expect(item).toEqual({ itemId: 'A1', titleZh: '全棉四件套', attrsZh: Array(30).fill('材质: 棉'), skusZh: ['白色'] });
    expect(parseTranslateItem({ itemId: 'A1', titleZh: '' })).toBeNull();
    expect(parseTranslateItem({ itemId: 'a b', titleZh: 'x' })).toBeNull();
    expect(parseTranslateItem({ itemId: 'A1', titleZh: 'x'.repeat(301) })).toBeNull();
  });
});
