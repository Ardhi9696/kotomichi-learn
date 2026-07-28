import type { Enums, Json } from '@/lib/supabase/database.types';

export const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const CONTENT_TYPES = ['vocabulary', 'kanji', 'grammar'] as const;
export const CATALOG_VIEW_MODES = ['grid', 'list'] as const;
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const VOCABULARY_PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'other',
] as const;
export const VOCABULARY_VERB_GROUPS = ['godan', 'ichidan', 'irregular'] as const;
export const VOCABULARY_TRANSITIVITIES = [
  'transitive',
  'intransitive',
] as const;
export const VOCABULARY_ADJECTIVE_TYPES = ['i', 'na'] as const;
export const VOCABULARY_THEMES = [
  'numbers_units',
  'self_family',
  'time_weather',
  'daily_life',
  'food_drink',
  'school_work',
  'travel_places',
  'nature_health',
  'communication_feelings',
] as const;

export type Level = Enums<'jlpt_level'>;
export type ContentType = Enums<'content_type'>;
export type CatalogTypeFilter = ContentType | 'all';
export type CatalogViewMode = (typeof CATALOG_VIEW_MODES)[number];
export type VocabularyPartOfSpeech = (typeof VOCABULARY_PARTS_OF_SPEECH)[number];
export type VocabularyVerbGroup = (typeof VOCABULARY_VERB_GROUPS)[number];
export type VocabularyTransitivity = (typeof VOCABULARY_TRANSITIVITIES)[number];
export type VocabularyAdjectiveType = (typeof VOCABULARY_ADJECTIVE_TYPES)[number];
export type VocabularyTheme = (typeof VOCABULARY_THEMES)[number];
export type Locale = 'en' | 'id' | 'ko';

export type VocabularyTaxonomy = {
  partsOfSpeech: VocabularyPartOfSpeech[];
  verbGroups: VocabularyVerbGroup[];
  transitivities: VocabularyTransitivity[];
  adjectiveTypes: VocabularyAdjectiveType[];
  themes: VocabularyTheme[];
  needsReview: boolean;
};

export type ExampleSentence = {
  ja: string;
  en: string;
};

export type CatalogItem = {
  id: string;
  type: ContentType;
  level: Level;
  title: string;
  reading: string | null;
  meanings: string[];
  supportingText: string | null;
  taxonomy: VocabularyTaxonomy | null;
};

type DetailBase = CatalogItem & {
  examples: ExampleSentence[];
  locale: Locale;
  isFallback: boolean;
};

export type VocabularyDetail = DetailBase & {
  type: 'vocabulary';
};

export type KanjiDetail = DetailBase & {
  type: 'kanji';
  onyomi: string[];
  kunyomi: string[];
  strokes: number | null;
  grade: number | null;
  frequency: number | null;
};

export type GrammarDetail = DetailBase & {
  type: 'grammar';
  formation: string;
  tags: string[];
  notes: string;
};

export type ContentDetail = VocabularyDetail | KanjiDetail | GrammarDetail;

export type CatalogQuery = {
  level: Level;
  type: CatalogTypeFilter;
  search: string;
  view: CatalogViewMode;
  partOfSpeech: VocabularyPartOfSpeech | 'all';
  verbGroup: VocabularyVerbGroup | 'all';
  transitivity: VocabularyTransitivity | 'all';
  adjectiveType: VocabularyAdjectiveType | 'all';
  theme: VocabularyTheme | 'all';
  page: number;
  pageSize: PageSize;
};

export type CatalogResult = {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function isLevel(value: string | undefined): value is Level {
  return LEVELS.some((level) => level === value);
}

export function isCatalogType(value: string | undefined): value is CatalogTypeFilter {
  return value === 'all' || CONTENT_TYPES.some((type) => type === value);
}

export function isCatalogViewMode(value: string | undefined): value is CatalogViewMode {
  return CATALOG_VIEW_MODES.some((view) => view === value);
}

function includesValue<const Values extends readonly string[]>(
  values: Values,
  value: string | undefined,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value);
}

export function isVocabularyPartOfSpeech(
  value: string | undefined,
): value is VocabularyPartOfSpeech {
  return includesValue(VOCABULARY_PARTS_OF_SPEECH, value);
}

export function isVocabularyVerbGroup(
  value: string | undefined,
): value is VocabularyVerbGroup {
  return includesValue(VOCABULARY_VERB_GROUPS, value);
}

export function isVocabularyTransitivity(
  value: string | undefined,
): value is VocabularyTransitivity {
  return includesValue(VOCABULARY_TRANSITIVITIES, value);
}

export function isVocabularyAdjectiveType(
  value: string | undefined,
): value is VocabularyAdjectiveType {
  return includesValue(VOCABULARY_ADJECTIVE_TYPES, value);
}

export function isVocabularyTheme(
  value: string | undefined,
): value is VocabularyTheme {
  return includesValue(VOCABULARY_THEMES, value);
}

export function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(value);
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'id' || value === 'ko';
}

export function parseExamples(value: Json): ExampleSentence[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (
      typeof entry === 'object' &&
      entry !== null &&
      !Array.isArray(entry) &&
      typeof entry.ja === 'string' &&
      typeof entry.en === 'string'
    ) {
      return [{ ja: entry.ja, en: entry.en }];
    }
    return [];
  });
}
