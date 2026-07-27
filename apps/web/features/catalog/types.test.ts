import { describe, expect, it } from 'vitest';

import {
  isCatalogType,
  isCatalogViewMode,
  isLevel,
  isLocale,
  isVocabularyPartOfSpeech,
  isVocabularyTheme,
  parseExamples,
} from './types';

describe('catalog value guards', () => {
  it('accepts supported filters', () => {
    expect(isLevel('N5')).toBe(true);
    expect(isCatalogType('grammar')).toBe(true);
    expect(isCatalogType('all')).toBe(true);
    expect(isCatalogViewMode('list')).toBe(true);
    expect(isLocale('ko')).toBe(true);
    expect(isVocabularyPartOfSpeech('verb')).toBe(true);
    expect(isVocabularyTheme('time_weather')).toBe(true);
  });

  it('rejects unsupported values', () => {
    expect(isLevel('N0')).toBe(false);
    expect(isCatalogType('sentence')).toBe(false);
    expect(isCatalogViewMode('table')).toBe(false);
    expect(isLocale('ja')).toBe(false);
    expect(isVocabularyPartOfSpeech('pronoun')).toBe(false);
    expect(isVocabularyTheme('sports')).toBe(false);
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
