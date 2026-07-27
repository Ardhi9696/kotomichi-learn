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
});
