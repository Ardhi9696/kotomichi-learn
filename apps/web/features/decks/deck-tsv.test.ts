import { describe, expect, it } from 'vitest';

import {
  DECK_TSV_HEADERS,
  calculateDeckDiff,
  parseDeckTsv,
  type DeckImportRow,
} from '@/features/decks/deck-tsv';

function tsv(...rows: string[][]): string {
  return [
    DECK_TSV_HEADERS.join('\t'),
    ...rows.map((row) => row.join('\t')),
  ].join('\n');
}

function row(overrides: Partial<Record<(typeof DECK_TSV_HEADERS)[number], string>> = {}) {
  const values: Record<(typeof DECK_TSV_HEADERS)[number], string> = {
    external_id: 'vocab-1',
    jp: '猫',
    reading: 'ねこ',
    display: '猫',
    level: 'N5',
    parts_of_speech: 'noun',
    adjective_type: '',
    verb_group: '',
    transitivity: '',
    pair_external_id: '',
    usage_frame: '',
    meaning_id: 'kucing',
    meaning_en: 'cat',
    meaning_ko: '고양이',
    example_jp: '',
    example_id: '',
    example_en: '',
    example_ko: '',
    themes: 'nature_health',
    tags: 'animal;basic',
    ...overrides,
  };
  return DECK_TSV_HEADERS.map((header) => values[header]);
}

describe('parseDeckTsv', () => {
  it('parses the exact v1 TSV header and semicolon values', async () => {
    const result = await parseDeckTsv(tsv(row()));

    expect(result.canImport).toBe(true);
    expect(result.rows[0]).toMatchObject({
      externalId: 'vocab-1',
      partsOfSpeech: ['noun'],
      themes: ['nature_health'],
      tags: ['animal', 'basic'],
    });
  });

  it('reports duplicate external ids by row', async () => {
    const result = await parseDeckTsv(tsv(row(), row({ jp: '犬', reading: 'いぬ' })));

    expect(result.canImport).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      row: 3,
      field: 'external_id',
      severity: 'error',
    }));
  });

  it('requires adjective type and never infers it from an い ending', async () => {
    const invalid = await parseDeckTsv(tsv(row({
      jp: '新しい',
      reading: 'あたらしい',
      parts_of_speech: 'adjective',
      adjective_type: '',
    })));
    expect(invalid.canImport).toBe(false);

    const kirei = await parseDeckTsv(tsv(row({
      jp: 'きれい',
      reading: 'きれい',
      parts_of_speech: 'adjective',
      adjective_type: 'na',
    })));
    expect(kirei.canImport).toBe(true);
    expect(kirei.rows[0]?.adjectiveType).toBe('na');
  });

  it('validates verb-only fields and same-deck pairs', async () => {
    const result = await parseDeckTsv(tsv(row({
      parts_of_speech: 'verb',
      verb_group: 'ichidan',
      transitivity: 'transitive',
      pair_external_id: 'missing',
    })));

    expect(result.canImport).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      field: 'pair_external_id',
    }));
  });

  it('requires Japanese and Indonesian examples as a pair', async () => {
    const result = await parseDeckTsv(tsv(row({ example_jp: '猫がいます。' })));
    expect(result.canImport).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ field: 'example_id' }));
  });

  it('supports quoted tab characters through PapaParse', async () => {
    const quoted = row({ meaning_id: '"arti\tdengan tab"' });
    const result = await parseDeckTsv(tsv(quoted));
    expect(result.canImport).toBe(true);
    expect(result.rows[0]?.meaningId).toBe('arti\tdengan tab');
  });
});

describe('calculateDeckDiff', () => {
  const base = {
    externalId: 'a',
    jp: '猫',
    reading: 'ねこ',
    display: '',
    level: 'N5',
    partsOfSpeech: ['noun'],
    adjectiveType: '',
    verbGroup: '',
    transitivity: '',
    pairExternalId: '',
    usageFrame: '',
    meaningId: 'kucing',
    meaningEn: '',
    meaningKo: '',
    exampleJp: '',
    exampleId: '',
    exampleEn: '',
    exampleKo: '',
    themes: [],
    tags: [],
  } satisfies DeckImportRow;

  it('counts added, changed, removed, and unchanged rows', () => {
    expect(calculateDeckDiff(
      [
        base,
        { ...base, externalId: 'removed' },
        { ...base, externalId: 'changed' },
      ],
      [base, { ...base, externalId: 'added' }, { ...base, externalId: 'changed', jp: '犬' }],
    )).toEqual({
      added: 1,
      changed: 1,
      removed: 1,
      unchanged: 1,
    });
  });
});
