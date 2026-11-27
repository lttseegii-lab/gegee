import { describe, it, expect } from 'vitest';
import { sampleProvider, sampleTranslation } from './sampleProvider';
import { normalizeTranslation } from './translate';
import { TAOBAO_CATEGORIES } from './types';

describe('sampleProvider', () => {
  it('returns flagged sample listings for every category, without translations', async () => {
    for (const category of TAOBAO_CATEGORIES) {
      const items = await sampleProvider.search({ category, query: '' });
      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item.category).toBe(category);
        expect(item.sample).toBe(true);
        expect(item.priceCny).toBeGreaterThan(0);
        expect(item).not.toHaveProperty('mn');
      }
    }
  });

  it('filters by Chinese or Mongolian keyword', async () => {
    expect((await sampleProvider.search({ category: 'duvet', query: '羊毛' })).map((i) => i.itemId)).toEqual(['SAMPLE-DUV-03']);
    expect((await sampleProvider.search({ category: 'duvet', query: 'Ноосон' })).map((i) => i.itemId)).toEqual(['SAMPLE-DUV-03']);
    expect(await sampleProvider.search({ category: 'towel', query: 'zzz' })).toEqual([]);
  });

  it('has a translation within the storefront limits for every listing', async () => {
    for (const category of TAOBAO_CATEGORIES) {
      for (const item of await sampleProvider.search({ category, query: '' })) {
        const ready = sampleTranslation(item.itemId);
        expect(ready).not.toBeNull();
        // Normalising must not have to cut anything off.
        expect(normalizeTranslation(ready!)).toEqual(ready);
        expect(ready!.name.length).toBeGreaterThanOrEqual(2);
        expect(ready!.variants).toHaveLength(item.skusZh.length);
      }
    }
    expect(sampleTranslation('REAL-1')).toBeNull();
  });
});
