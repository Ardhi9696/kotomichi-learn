import Papa, { type ParseError, type ParseResult } from 'papaparse';

import {
  LEVELS,
  VOCABULARY_ADJECTIVE_TYPES,
  VOCABULARY_PARTS_OF_SPEECH,
  VOCABULARY_THEMES,
  VOCABULARY_TRANSITIVITIES,
  VOCABULARY_VERB_GROUPS,
  type Level,
  type VocabularyAdjectiveType,
  type VocabularyPartOfSpeech,
  type VocabularyTheme,
  type VocabularyTransitivity,
  type VocabularyVerbGroup,
} from '@/features/catalog/types';

export const DECK_TSV_MAX_BYTES = 5 * 1024 * 1024;
export const DECK_TSV_MAX_ROWS = 10_000;

export const DECK_TSV_HEADERS = [
  'external_id',
  'jp',
  'reading',
  'display',
  'level',
  'parts_of_speech',
  'adjective_type',
  'verb_group',
  'transitivity',
  'pair_external_id',
  'usage_frame',
  'meaning_id',
  'meaning_en',
  'meaning_ko',
  'example_jp',
  'example_id',
  'example_en',
  'example_ko',
  'themes',
  'tags',
] as const;

type Header = (typeof DECK_TSV_HEADERS)[number];
type RawDeckRow = Record<Header, string> & { __parsed_extra?: string[] };

export type DeckImportRow = {
  externalId: string;
  jp: string;
  reading: string;
  display: string;
  level: Level;
  partsOfSpeech: VocabularyPartOfSpeech[];
  adjectiveType: VocabularyAdjectiveType | '';
  verbGroup: VocabularyVerbGroup | '';
  transitivity: VocabularyTransitivity | '';
  pairExternalId: string;
  usageFrame: string;
  meaningId: string;
  meaningEn: string;
  meaningKo: string;
  exampleJp: string;
  exampleId: string;
  exampleEn: string;
  exampleKo: string;
  themes: VocabularyTheme[];
  tags: string[];
};

export type DeckTsvIssue = {
  row: number;
  field?: Header;
  severity: 'error' | 'warning';
  message: string;
};

export type DeckTsvResult = {
  rows: DeckImportRow[];
  issues: DeckTsvIssue[];
  canImport: boolean;
};

export type DeckDiff = {
  added: number;
  changed: number;
  removed: number;
  unchanged: number;
};

const htmlPattern = /<\/?[a-z][^>]*>/i;

function splitValues(value: string): string[] {
  return [...new Set(value.split(';').map((part) => part.trim()).filter(Boolean))];
}

function valueIn<const Values extends readonly string[]>(
  values: Values,
  value: string,
): value is Values[number] {
  return values.some((entry) => entry === value);
}

function parserIssue(error: ParseError): DeckTsvIssue {
  return {
    row: (error.row ?? 0) + 2,
    severity: 'error',
    message: error.message,
  };
}

function parseWithPapa(input: string | File): Promise<ParseResult<RawDeckRow>> {
  return new Promise((resolve, reject) => {
    if (typeof input === 'string') {
      Papa.parse<RawDeckRow>(input, {
        delimiter: '\t',
        header: true,
        skipEmptyLines: 'greedy',
        complete: resolve,
      });
    } else {
      Papa.parse<RawDeckRow>(input, {
        delimiter: '\t',
        header: true,
        skipEmptyLines: 'greedy',
        worker: true,
        complete: resolve,
        error: reject,
      });
    }
  });
}

function issue(
  issues: DeckTsvIssue[],
  row: number,
  message: string,
  field?: Header,
  severity: DeckTsvIssue['severity'] = 'error',
) {
  issues.push({ row, field, severity, message });
}

function normalizeRow(raw: RawDeckRow, row: number, issues: DeckTsvIssue[]): DeckImportRow {
  const text = (field: Header) => (raw[field] ?? '').trim();
  const partsOfSpeech = splitValues(text('parts_of_speech'));
  const themes = splitValues(text('themes'));
  const adjectiveType = text('adjective_type');
  const verbGroup = text('verb_group');
  const transitivity = text('transitivity');
  const level = text('level');

  for (const field of [
    'external_id',
    'jp',
    'reading',
    'level',
    'parts_of_speech',
    'meaning_id',
  ] satisfies Header[]) {
    if (!text(field)) issue(issues, row, `${field} wajib diisi.`, field);
  }

  if (!valueIn(LEVELS, level)) {
    issue(issues, row, 'level harus salah satu N5, N4, N3, N2, atau N1.', 'level');
  }

  if (!partsOfSpeech.length || partsOfSpeech.some(
    (value) => !valueIn(VOCABULARY_PARTS_OF_SPEECH, value),
  )) {
    issue(
      issues,
      row,
      'parts_of_speech hanya menerima noun, verb, adjective, atau other.',
      'parts_of_speech',
    );
  }

  const isAdjective = partsOfSpeech.includes('adjective');
  if (isAdjective && !valueIn(VOCABULARY_ADJECTIVE_TYPES, adjectiveType)) {
    issue(
      issues,
      row,
      'adjective_type wajib tepat satu: i atau na.',
      'adjective_type',
    );
  }
  if (!isAdjective && adjectiveType) {
    issue(
      issues,
      row,
      'adjective_type harus kosong untuk materi non-adjective.',
      'adjective_type',
    );
  }
  if (isAdjective && text('jp').endsWith('い')) {
    issue(
      issues,
      row,
      'Akhiran い tidak menentukan tipe adjective; klasifikasi eksplisit dipertahankan.',
      'adjective_type',
      'warning',
    );
  }

  const isVerb = partsOfSpeech.includes('verb');
  if (isVerb && !valueIn(VOCABULARY_VERB_GROUPS, verbGroup)) {
    issue(
      issues,
      row,
      'verb_group wajib diisi godan, ichidan, atau irregular untuk verb.',
      'verb_group',
    );
  }
  if (!isVerb && verbGroup) {
    issue(issues, row, 'verb_group harus kosong untuk materi non-verb.', 'verb_group');
  }
  if (transitivity && !valueIn(VOCABULARY_TRANSITIVITIES, transitivity)) {
    issue(
      issues,
      row,
      'transitivity harus transitive atau intransitive.',
      'transitivity',
    );
  }
  if (!isVerb && (transitivity || text('pair_external_id'))) {
    issue(
      issues,
      row,
      'transitivity dan pair_external_id hanya dapat digunakan pada verb.',
      transitivity ? 'transitivity' : 'pair_external_id',
    );
  }

  const hasExampleJp = Boolean(text('example_jp'));
  const hasExampleId = Boolean(text('example_id'));
  if (hasExampleJp !== hasExampleId) {
    issue(
      issues,
      row,
      'example_jp dan example_id wajib diisi berpasangan.',
      hasExampleJp ? 'example_id' : 'example_jp',
    );
  }

  if (text('display') && htmlPattern.test(text('display'))) {
    issue(issues, row, 'display harus berupa teks biasa tanpa HTML.', 'display');
  }

  if (themes.some((value) => !valueIn(VOCABULARY_THEMES, value))) {
    issue(issues, row, 'themes berisi nilai yang tidak didukung.', 'themes');
  }

  if (raw.__parsed_extra?.length) {
    issue(issues, row, 'Baris memiliki kolom tambahan di luar header v1.');
  }

  return {
    externalId: text('external_id'),
    jp: text('jp'),
    reading: text('reading'),
    display: text('display'),
    level: valueIn(LEVELS, level) ? level : 'N5',
    partsOfSpeech: partsOfSpeech.filter((value): value is VocabularyPartOfSpeech =>
      valueIn(VOCABULARY_PARTS_OF_SPEECH, value),
    ),
    adjectiveType: valueIn(VOCABULARY_ADJECTIVE_TYPES, adjectiveType)
      ? adjectiveType
      : '',
    verbGroup: valueIn(VOCABULARY_VERB_GROUPS, verbGroup) ? verbGroup : '',
    transitivity: valueIn(VOCABULARY_TRANSITIVITIES, transitivity)
      ? transitivity
      : '',
    pairExternalId: text('pair_external_id'),
    usageFrame: text('usage_frame'),
    meaningId: text('meaning_id'),
    meaningEn: text('meaning_en'),
    meaningKo: text('meaning_ko'),
    exampleJp: text('example_jp'),
    exampleId: text('example_id'),
    exampleEn: text('example_en'),
    exampleKo: text('example_ko'),
    themes: themes.filter((value): value is VocabularyTheme =>
      valueIn(VOCABULARY_THEMES, value),
    ),
    tags: splitValues(text('tags')),
  };
}

export async function parseDeckTsv(input: string | File): Promise<DeckTsvResult> {
  if (typeof input !== 'string' && input.size > DECK_TSV_MAX_BYTES) {
    const issues: DeckTsvIssue[] = [{
      row: 0,
      severity: 'error',
      message: 'Ukuran file melebihi batas 5 MiB.',
    }];
    return { rows: [], issues, canImport: false };
  }

  const result = await parseWithPapa(input);
  const issues = result.errors.map(parserIssue);
  const fields = result.meta.fields ?? [];

  if (
    fields.length !== DECK_TSV_HEADERS.length
    || DECK_TSV_HEADERS.some((field, index) => fields[index] !== field)
  ) {
    issue(
      issues,
      1,
      `Header TSV v1 harus persis: ${DECK_TSV_HEADERS.join('\\t')}`,
    );
  }

  if (result.data.length > DECK_TSV_MAX_ROWS) {
    issue(issues, 0, 'Jumlah baris melebihi batas 10.000.');
  }

  const rows = result.data
    .slice(0, DECK_TSV_MAX_ROWS)
    .map((raw, index) => normalizeRow(raw, index + 2, issues));
  const firstRowByExternalId = new Map<string, number>();

  rows.forEach((row, index) => {
    const line = index + 2;
    if (!row.externalId) return;
    const firstRow = firstRowByExternalId.get(row.externalId);
    if (firstRow) {
      issue(
        issues,
        line,
        `external_id duplikat; pertama muncul pada baris ${firstRow}.`,
        'external_id',
      );
    } else {
      firstRowByExternalId.set(row.externalId, line);
    }
  });

  const knownIds = new Set(rows.map((row) => row.externalId));
  rows.forEach((row, index) => {
    if (row.pairExternalId && !knownIds.has(row.pairExternalId)) {
      issue(
        issues,
        index + 2,
        'pair_external_id harus merujuk external_id dalam deck yang sama.',
        'pair_external_id',
      );
    }
  });

  return {
    rows,
    issues,
    canImport: !issues.some((entry) => entry.severity === 'error'),
  };
}

export function calculateDeckDiff(
  current: DeckImportRow[],
  incoming: DeckImportRow[],
): DeckDiff {
  const currentById = new Map(current.map((row) => [row.externalId, row]));
  const incomingById = new Map(incoming.map((row) => [row.externalId, row]));
  let added = 0;
  let changed = 0;
  let unchanged = 0;

  for (const [externalId, row] of incomingById) {
    const existing = currentById.get(externalId);
    if (!existing) added += 1;
    else if (JSON.stringify(existing) === JSON.stringify(row)) unchanged += 1;
    else changed += 1;
  }

  return {
    added,
    changed,
    removed: [...currentById.keys()].filter((id) => !incomingById.has(id)).length,
    unchanged,
  };
}

export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
