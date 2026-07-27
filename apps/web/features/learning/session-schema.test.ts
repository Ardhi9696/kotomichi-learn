import { describe, expect, it } from 'vitest';

import { createLearningSessionSchema } from './session-schema';

describe('createLearningSessionSchema', () => {
  it('accepts a supported learning session', () => {
    const result = createLearningSessionSchema.safeParse({
      level: 'N5',
      contentTypes: ['vocabulary', 'kanji'],
      itemCount: '10',
    });

    expect(result.success).toBe(true);
  });

  it('requires at least one content type', () => {
    const result = createLearningSessionSchema.safeParse({
      level: 'N5',
      contentTypes: [],
      itemCount: 10,
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported item counts', () => {
    const result = createLearningSessionSchema.safeParse({
      level: 'N5',
      contentTypes: ['vocabulary'],
      itemCount: 17,
    });

    expect(result.success).toBe(false);
  });

  it('accepts N5/N4 vocabulary taxonomy filters', () => {
    const result = createLearningSessionSchema.safeParse({
      level: 'N4',
      contentTypes: ['vocabulary'],
      itemCount: 10,
      vocabularyPartOfSpeech: 'verb',
      vocabularyVerbGroup: 'godan',
      vocabularyTheme: 'daily_life',
    });

    expect(result.success).toBe(true);
  });

  it('rejects taxonomy filters outside N5/N4', () => {
    const result = createLearningSessionSchema.safeParse({
      level: 'N3',
      contentTypes: ['vocabulary'],
      itemCount: 10,
      vocabularyTheme: 'daily_life',
    });

    expect(result.success).toBe(false);
  });
});
