import type { Enums, Json } from '@/lib/supabase/database.types';

export const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const CONTENT_TYPES = ['vocabulary', 'kanji', 'grammar'] as const;

export type Level = Enums<'jlpt_level'>;
export type ContentType = Enums<'content_type'>;
export type CatalogTypeFilter = ContentType | 'all';
export type Locale = 'en' | 'id' | 'ko';

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
  page: number;
  pageSize?: number;
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
