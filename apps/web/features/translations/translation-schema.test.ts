import { describe, expect, it } from 'vitest';

import { translationDraftSchema } from '@/features/translations/translation-schema';

const input = {
  contentItemId: '3d4cb4e8-cf13-49c4-aa9f-a3b55bd52f41',
  contentType: 'vocabulary',
  locale: 'id',
  meanings: 'makan\nmenyantap',
  examples: '魚を食べる。 | Saya makan ikan.',
  formation: '',
  tags: '',
  notes: '',
};

describe('translation draft schema', () => {
  it('normalizes meanings and translated examples', () => {
    const result = translationDraftSchema.parse(input);
    expect(result.meanings).toEqual(['makan', 'menyantap']);
    expect(result.examples).toEqual([
      { ja: '魚を食べる。', en: 'Saya makan ikan.' },
    ]);
  });

  it('rejects an unsupported locale', () => {
    expect(translationDraftSchema.safeParse({ ...input, locale: 'en' }).success).toBe(
      false,
    );
  });
});
