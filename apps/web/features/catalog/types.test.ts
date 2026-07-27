import { describe, expect, it } from 'vitest';

import { isCatalogType, isLevel, isLocale, parseExamples } from './types';

describe('catalog value guards', () => {
  it('accepts supported filters', () => {
    expect(isLevel('N5')).toBe(true);
    expect(isCatalogType('grammar')).toBe(true);
    expect(isCatalogType('all')).toBe(true);
    expect(isLocale('ko')).toBe(true);
  });

  it('rejects unsupported values', () => {
    expect(isLevel('N0')).toBe(false);
    expect(isCatalogType('sentence')).toBe(false);
    expect(isLocale('ja')).toBe(false);
  });
});

describe('parseExamples', () => {
  it('keeps only valid bilingual examples', () => {
    expect(
      parseExamples([
        { ja: '魚を食べる。', en: 'I eat fish.' },
        { ja: 'invalid' },
        null,
      ]),
    ).toEqual([{ ja: '魚を食べる。', en: 'I eat fish.' }]);
  });
});
