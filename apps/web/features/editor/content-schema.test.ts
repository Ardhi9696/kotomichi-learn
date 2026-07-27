import { describe, expect, it } from 'vitest';

import { editorialContentSchema } from '@/features/editor/content-schema';

const validInput = {
  contentItemId: '',
  contentType: 'vocabulary',
  level: 'N5',
  title: '食べる',
  reading: 'たべる',
  meanings: 'eat\nto consume',
  examples: '魚を食べる。 | I eat fish.',
  formation: '',
  tags: '',
  notes: '',
  onyomi: '',
  kunyomi: '',
  strokes: '',
  grade: '',
  frequency: '',
  partsOfSpeech: ['verb'],
  verbGroups: ['ichidan'],
  transitivities: ['transitive'],
  adjectiveTypes: [],
  themes: ['food_drink'],
};

describe('editorial content schema', () => {
  it('normalizes list, example, and optional number fields', () => {
    const result = editorialContentSchema.parse(validInput);

    expect(result.contentItemId).toBeNull();
    expect(result.meanings).toEqual(['eat', 'to consume']);
    expect(result.examples).toEqual([{ ja: '魚を食べる。', en: 'I eat fish.' }]);
    expect(result.strokes).toBeNull();
    expect(result.verbGroups).toEqual(['ichidan']);
  });

  it('rejects malformed examples', () => {
    expect(
      editorialContentSchema.safeParse({
        ...validInput,
        examples: '魚を食べる。',
      }).success,
    ).toBe(false);
  });

  it('requires at least one meaning', () => {
    expect(
      editorialContentSchema.safeParse({
        ...validInput,
        meanings: '  ',
      }).success,
    ).toBe(false);
  });

  it('rejects verb metadata when the verb class is not selected', () => {
    expect(
      editorialContentSchema.safeParse({
        ...validInput,
        partsOfSpeech: ['noun'],
      }).success,
    ).toBe(false);
  });
});
