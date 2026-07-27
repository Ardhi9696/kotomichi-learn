import { describe, expect, it } from 'vitest';

import { sourceManifestSchema } from './source-schema';

const validManifest = {
  source_version: '2026-07-27',
  source_commit: 'abc123',
  dataset_checksum: 'a'.repeat(64),
  vocabulary: [
    { level: 'N5', word: '水', reading: 'みず', meanings: ['water'], examples: [] },
  ],
  kanji: [
    {
      level: 'N5',
      character: '水',
      onyomi: ['スイ'],
      kunyomi: ['みず'],
      meanings: ['water'],
    },
  ],
  grammar: [
    {
      level: 'N5',
      pattern: '〜です',
      meaning: 'to be',
      formation: 'Noun + です',
      examples: [],
      tags: [],
      notes: '',
    },
  ],
};

describe('sourceManifestSchema', () => {
  it('accepts a normalized complete manifest', () => {
    expect(sourceManifestSchema.safeParse(validManifest).success).toBe(true);
  });

  it('requires every content family', () => {
    expect(
      sourceManifestSchema.safeParse({ ...validManifest, grammar: [] }).success,
    ).toBe(false);
  });

  it('rejects a checksum that is not SHA-256', () => {
    expect(
      sourceManifestSchema.safeParse({
        ...validManifest,
        dataset_checksum: 'abc',
      }).success,
    ).toBe(false);
  });
});

