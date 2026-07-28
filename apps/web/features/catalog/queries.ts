import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';

import {
  type CatalogItem,
  type CatalogQuery,
  type CatalogResult,
  type ContentDetail,
  type ContentType,
  type Level,
  type Locale,
  type VocabularyTaxonomy,
  parseExamples,
} from '@/features/catalog/types';
import type { Enums, Tables } from '@/lib/supabase/database.types';
import { createPublicClient } from '@/lib/supabase/public';

type ContentItemRow = Pick<
  Tables<'content_items'>,
  'id' | 'content_type' | 'level' | 'word' | 'reading' | 'character' | 'pattern'
>;
type VocabRow = Pick<
  Tables<'vocab'>,
  'content_item_id' | 'word' | 'reading' | 'meanings' | 'examples'
>;
type KanjiRow = Pick<
  Tables<'kanji'>,
  | 'content_item_id'
  | 'character'
  | 'meanings'
  | 'onyomi'
  | 'kunyomi'
  | 'strokes'
  | 'grade'
  | 'frequency'
>;
type GrammarRow = Pick<
  Tables<'grammar'>,
  | 'content_item_id'
  | 'pattern'
  | 'meaning'
  | 'formation'
  | 'examples'
  | 'tags'
  | 'notes'
>;
type EditorialRow = Pick<
  Tables<'editorial_content_details'>,
  | 'content_item_id'
  | 'title'
  | 'reading'
  | 'meanings'
  | 'examples'
  | 'formation'
  | 'tags'
  | 'notes'
  | 'onyomi'
  | 'kunyomi'
  | 'strokes'
  | 'grade'
  | 'frequency'
>;
type TaxonomyRow = Pick<
  Tables<'vocabulary_taxonomy'>,
  | 'content_item_id'
  | 'parts_of_speech'
  | 'verb_groups'
  | 'transitivities'
  | 'adjective_types'
  | 'themes'
  | 'needs_review'
>;

function cleanSearchTerm(value: string): string {
  return value.trim().replaceAll(/[,%()]/g, '').slice(0, 80);
}

function titleFor(item: ContentItemRow): string {
  return item.word ?? item.character ?? item.pattern ?? '';
}

function emptyVersionMaps() {
  return {
    vocabulary: new Map<string, VocabRow>(),
    kanji: new Map<string, KanjiRow>(),
    grammar: new Map<string, GrammarRow>(),
    editorial: new Map<string, EditorialRow>(),
    taxonomy: new Map<string, TaxonomyRow>(),
  };
}

async function getVersionMaps(items: ContentItemRow[]) {
  const client = createPublicClient();
  const idsByType = {
    vocabulary: items
      .filter((item) => item.content_type === 'vocabulary')
      .map((item) => item.id),
    kanji: items.filter((item) => item.content_type === 'kanji').map((item) => item.id),
    grammar: items
      .filter((item) => item.content_type === 'grammar')
      .map((item) => item.id),
  };
  const maps = emptyVersionMaps();

  const [vocabResult, kanjiResult, grammarResult, editorialResult, taxonomyResult] =
    await Promise.all([
    idsByType.vocabulary.length
      ? client
          .from('vocab')
          .select('content_item_id,word,reading,meanings,examples')
          .in('content_item_id', idsByType.vocabulary)
      : Promise.resolve({ data: [], error: null }),
    idsByType.kanji.length
      ? client
          .from('kanji')
          .select(
            'content_item_id,character,meanings,onyomi,kunyomi,strokes,grade,frequency',
          )
          .in('content_item_id', idsByType.kanji)
      : Promise.resolve({ data: [], error: null }),
    idsByType.grammar.length
      ? client
          .from('grammar')
          .select('content_item_id,pattern,meaning,formation,examples,tags,notes')
          .in('content_item_id', idsByType.grammar)
      : Promise.resolve({ data: [], error: null }),
    items.length
      ? client
          .from('editorial_content_details')
          .select(
            'content_item_id,title,reading,meanings,examples,formation,tags,notes,onyomi,kunyomi,strokes,grade,frequency',
          )
          .in(
            'content_item_id',
            items.map((item) => item.id),
          )
      : Promise.resolve({ data: [], error: null }),
    idsByType.vocabulary.length
      ? client
          .from('vocabulary_taxonomy')
          .select(
            'content_item_id,parts_of_speech,verb_groups,transitivities,adjective_types,themes,needs_review',
          )
          .in('content_item_id', idsByType.vocabulary)
      : Promise.resolve({ data: [], error: null }),
    ]);

  const error =
    vocabResult.error ??
    kanjiResult.error ??
    grammarResult.error ??
    editorialResult.error ??
    taxonomyResult.error;
  if (error) throw new Error(`Unable to load content: ${error.message}`);

  (vocabResult.data ?? []).forEach((row) =>
    maps.vocabulary.set(row.content_item_id, row),
  );
  (kanjiResult.data ?? []).forEach((row) =>
    maps.kanji.set(row.content_item_id, row),
  );
  (grammarResult.data ?? []).forEach((row) =>
    maps.grammar.set(row.content_item_id, row),
  );
  (editorialResult.data ?? []).forEach((row) =>
    maps.editorial.set(row.content_item_id, row),
  );
  (taxonomyResult.data ?? []).forEach((row) =>
    maps.taxonomy.set(row.content_item_id, row),
  );

  return maps;
}

function toCatalogItem(
  item: ContentItemRow,
  maps: Awaited<ReturnType<typeof getVersionMaps>>,
): CatalogItem {
  const editorial = maps.editorial.get(item.id);
  const taxonomyRow = maps.taxonomy.get(item.id);
  const taxonomy: VocabularyTaxonomy | null = taxonomyRow
    ? {
        partsOfSpeech: taxonomyRow.parts_of_speech,
        verbGroups: taxonomyRow.verb_groups,
        transitivities: taxonomyRow.transitivities,
        adjectiveTypes: taxonomyRow.adjective_types,
        themes: taxonomyRow.themes,
        needsReview: taxonomyRow.needs_review,
      }
    : null;
  if (editorial) {
    return {
      id: item.id,
      type: item.content_type,
      level: item.level,
      title: editorial.title,
      reading: editorial.reading || null,
      meanings: editorial.meanings,
      supportingText:
        item.content_type === 'grammar'
          ? editorial.formation || null
          : item.content_type === 'kanji' && editorial.strokes
            ? `${editorial.strokes} strokes`
            : null,
      taxonomy: item.content_type === 'vocabulary' ? taxonomy : null,
    };
  }

  if (item.content_type === 'vocabulary') {
    const version = maps.vocabulary.get(item.id);
    return {
      id: item.id,
      type: item.content_type,
      level: item.level,
      title: titleFor(item),
      reading: item.reading || null,
      meanings: version?.meanings ?? [],
      supportingText: null,
      taxonomy,
    };
  }

  if (item.content_type === 'kanji') {
    const version = maps.kanji.get(item.id);
    return {
      id: item.id,
      type: item.content_type,
      level: item.level,
      title: titleFor(item),
      reading: version?.kunyomi[0] ?? version?.onyomi[0] ?? null,
      meanings: version?.meanings ?? [],
      supportingText: version?.strokes ? `${version.strokes} strokes` : null,
      taxonomy: null,
    };
  }

  const version = maps.grammar.get(item.id);
  return {
    id: item.id,
    type: item.content_type,
    level: item.level,
    title: titleFor(item),
    reading: null,
    meanings: version ? [version.meaning] : [],
    supportingText: version?.formation || null,
    taxonomy: null,
  };
}

type CatalogRow = {
  content_item_id: string;
  total_count: number;
  item_word: string | null;
  item_reading: string | null;
  item_character: string | null;
  item_pattern: string | null;
  content_type: Enums<'content_type'>;
  level: Enums<'jlpt_level'>;
  vocab_word: string | null;
  vocab_reading: string | null;
  vocab_meanings: string[] | null;
  vocab_examples: unknown | null;
  kanji_char: string | null;
  kanji_meanings: string[] | null;
  kanji_onyomi: string[] | null;
  kanji_kunyomi: string[] | null;
  kanji_strokes: number | null;
  kanji_grade: number | null;
  kanji_frequency: number | null;
  grammar_pattern: string | null;
  grammar_meaning: string | null;
  grammar_formation: string | null;
  grammar_examples: unknown | null;
  grammar_tags: string[] | null;
  grammar_notes: string | null;
  editorial_title: string | null;
  editorial_reading: string | null;
  editorial_meanings: string[] | null;
  editorial_examples: unknown | null;
  editorial_formation: string | null;
  editorial_tags: string[] | null;
  editorial_notes: string | null;
  editorial_onyomi: string[] | null;
  editorial_kunyomi: string[] | null;
  editorial_strokes: number | null;
  editorial_grade: number | null;
  editorial_frequency: number | null;
  taxonomy_parts_of_speech: Enums<'vocabulary_part_of_speech'>[] | null;
  taxonomy_verb_groups: Enums<'vocabulary_verb_group'>[] | null;
  taxonomy_transitivities: Enums<'vocabulary_transitivity'>[] | null;
  taxonomy_adjective_types: Enums<'vocabulary_adjective_type'>[] | null;
  taxonomy_themes: Enums<'vocabulary_theme'>[] | null;
  taxonomy_needs_review: boolean | null;
};

function rowToCatalogItem(row: CatalogRow): CatalogItem {
  const taxonomy: VocabularyTaxonomy | null = row.taxonomy_parts_of_speech
    ? {
        partsOfSpeech: row.taxonomy_parts_of_speech,
        verbGroups: row.taxonomy_verb_groups ?? [],
        transitivities: row.taxonomy_transitivities ?? [],
        adjectiveTypes: row.taxonomy_adjective_types ?? [],
        themes: row.taxonomy_themes ?? [],
        needsReview: row.taxonomy_needs_review ?? false,
      }
    : null;
  const ctype = row.content_type as ContentType;
  const clevel = row.level as Level;

  if (row.editorial_title) {
    return {
      id: row.content_item_id,
      type: ctype,
      level: clevel,
      title: row.editorial_title,
      reading: row.editorial_reading || null,
      meanings: row.editorial_meanings ?? [],
      supportingText:
        row.content_type === 'grammar'
          ? row.editorial_formation || null
          : row.content_type === 'kanji' && row.editorial_strokes
            ? `${row.editorial_strokes} strokes`
            : null,
      taxonomy: row.content_type === 'vocabulary' ? taxonomy : null,
    };
  }

  if (row.content_type === 'vocabulary') {
    return {
      id: row.content_item_id,
      type: ctype,
      level: clevel,
      title: row.item_word ?? '',
      reading: row.item_reading || null,
      meanings: row.vocab_meanings ?? [],
      supportingText: null,
      taxonomy,
    };
  }

  if (row.content_type === 'kanji') {
    return {
      id: row.content_item_id,
      type: ctype,
      level: clevel,
      title: row.item_character ?? '',
      reading: row.kanji_kunyomi?.[0] ?? row.kanji_onyomi?.[0] ?? null,
      meanings: row.kanji_meanings ?? [],
      supportingText: row.kanji_strokes ? `${row.kanji_strokes} strokes` : null,
      taxonomy: null,
    };
  }

  return {
    id: row.content_item_id,
    type: ctype,
    level: clevel,
    title: row.item_pattern ?? '',
    reading: null,
    meanings: row.grammar_meaning ? [row.grammar_meaning] : [],
    supportingText: row.grammar_formation || null,
    taxonomy: null,
  };
}

async function getCatalogUncached(query: CatalogQuery): Promise<CatalogResult> {
  const client = createPublicClient();
  const pageSize = query.pageSize;
  const page = Math.max(1, query.page);
  const from = (page - 1) * pageSize;

  const search = cleanSearchTerm(query.search);
  const usesVocabularyTaxonomy = query.type === 'vocabulary';
  const { data: rows, error } = await client.rpc(
    'browse_catalog_items_with_details',
    {
      p_level: query.level,
      p_content_type: query.type === 'all' ? null : query.type,
      p_search: search,
      p_parts_of_speech:
        !usesVocabularyTaxonomy || query.partOfSpeech === 'all'
          ? []
          : [query.partOfSpeech],
      p_verb_groups:
        !usesVocabularyTaxonomy || query.verbGroup === 'all'
          ? []
          : [query.verbGroup],
      p_transitivities:
        !usesVocabularyTaxonomy || query.transitivity === 'all'
          ? []
          : [query.transitivity],
      p_adjective_types:
        !usesVocabularyTaxonomy || query.adjectiveType === 'all'
          ? []
          : [query.adjectiveType],
      p_themes:
        !usesVocabularyTaxonomy || query.theme === 'all' ? [] : [query.theme],
      p_offset: from,
      p_limit: pageSize,
    },
  );

  if (error) throw new Error(`Unable to browse catalog: ${error.message}`);

  const items = (rows ?? []).map(rowToCatalogItem);
  const total = Number((rows ?? [])[0]?.total_count ?? 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getPublishedTranslation(
  type: ContentType,
  contentItemId: string,
  locale: Exclude<Locale, 'en'>,
): Promise<{
  meanings: string[];
  examples?: Tables<'vocab_translations'>['examples'];
  formation?: string;
  tags?: string[];
  notes?: string;
} | null> {
  const client = createPublicClient();

  if (type === 'grammar') {
    const { data } = await client
      .from('grammar_translations')
      .select('meaning,formation,examples,tags,notes')
      .eq('content_item_id', contentItemId)
      .eq('locale', locale)
      .eq('status', 'published')
      .maybeSingle();
    return data
      ? {
          meanings: [data.meaning],
          formation: data.formation,
          examples: data.examples,
          tags: data.tags,
          notes: data.notes,
        }
      : null;
  }

  const table = type === 'vocabulary' ? 'vocab_translations' : 'kanji_translations';
  if (table === 'vocab_translations') {
    const { data } = await client
      .from(table)
      .select('meanings,examples')
      .eq('content_item_id', contentItemId)
      .eq('locale', locale)
      .eq('status', 'published')
      .maybeSingle();
    return data ? { meanings: data.meanings, examples: data.examples } : null;
  }
  const { data } = await client
    .from(table)
    .select('meanings')
    .eq('content_item_id', contentItemId)
    .eq('locale', locale)
    .eq('status', 'published')
    .maybeSingle();
  return data ? { meanings: data.meanings } : null;
}

async function getContentDetailUncached(
  id: string,
  locale: Locale,
): Promise<ContentDetail> {
  const client = createPublicClient();
  const { data: item, error } = await client
    .from('content_items')
    .select('id,content_type,level,word,reading,character,pattern')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`Unable to load content: ${error.message}`);
  if (!item) notFound();

  const maps = await getVersionMaps([item]);
  const base = toCatalogItem(item, maps);
  const translated =
    locale === 'en'
      ? null
      : await getPublishedTranslation(item.content_type, item.id, locale);
  const meanings = translated?.meanings ?? base.meanings;
  const isFallback = locale !== 'en' && translated === null;
  const editorial = maps.editorial.get(item.id);

  if (item.content_type === 'vocabulary') {
    const version = maps.vocabulary.get(item.id);
    return {
      ...base,
      type: 'vocabulary',
      meanings,
      examples: translated?.examples
        ? parseExamples(translated.examples)
        : editorial
          ? parseExamples(editorial.examples)
          : version
            ? parseExamples(version.examples)
            : [],
      locale,
      isFallback,
    };
  }

  if (item.content_type === 'kanji') {
    const version = maps.kanji.get(item.id);
    return {
      ...base,
      type: 'kanji',
      meanings,
      examples: [],
      onyomi: editorial?.onyomi ?? version?.onyomi ?? [],
      kunyomi: editorial?.kunyomi ?? version?.kunyomi ?? [],
      strokes: editorial?.strokes ?? version?.strokes ?? null,
      grade: editorial?.grade ?? version?.grade ?? null,
      frequency: editorial?.frequency ?? version?.frequency ?? null,
      locale,
      isFallback,
    };
  }

  const version = maps.grammar.get(item.id);
  return {
    ...base,
    type: 'grammar',
    meanings,
    examples: translated?.examples
      ? parseExamples(translated.examples)
      : editorial
        ? parseExamples(editorial.examples)
        : version
          ? parseExamples(version.examples)
          : [],
    formation: translated?.formation ?? editorial?.formation ?? version?.formation ?? '',
    tags: translated?.tags ?? editorial?.tags ?? version?.tags ?? [],
    notes: translated?.notes ?? editorial?.notes ?? version?.notes ?? '',
    locale,
    isFallback,
  };
}

/** Public data only: this function never reads cookies or uses a user-bound client. */
export async function getCatalog(query: CatalogQuery): Promise<CatalogResult> {
  const normalizedQuery = { ...query, search: cleanSearchTerm(query.search) };
  return unstable_cache(
    () => getCatalogUncached(normalizedQuery),
    ['catalog', JSON.stringify(normalizedQuery)],
    { revalidate: 300, tags: ['catalog'] },
  )();
}

/** Public data only. Locale is part of the cache key and editorial mutations revalidate its tag. */
export async function getContentDetail(id: string, locale: Locale): Promise<ContentDetail> {
  return unstable_cache(
    () => getContentDetailUncached(id, locale),
    ['catalog-detail', id, locale],
    { revalidate: 300, tags: ['catalog', `content:${id}`] },
  )();
}

/**
 * Batch-load multiple content details (for e.g. distractor data in flashcard sessions).
 * Shares version maps across all items instead of calling getContentDetail N times.
 */
async function getContentDetailsBatchUncached(
  ids: string[],
  locale: Locale,
): Promise<ContentDetail[]> {
  if (ids.length === 0) return [];
  const client = createPublicClient();

  const { data: items, error: itemsError } = await client
    .from('content_items')
    .select('id,content_type,level,word,reading,character,pattern')
    .in('id', ids);

  if (itemsError) throw new Error(`Unable to batch-load content: ${itemsError.message}`);

  const idOrder = new Map(ids.map((id, i) => [id, i]));
  const sorted = items
    .filter((item) => idOrder.has(item.id))
    .sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

  const maps = await getVersionMaps(sorted);
  const idsByType = { vocabulary: new Set<string>(), kanji: new Set<string>(), grammar: new Set<string>() };
  for (const item of sorted) {
    if (item.content_type === 'vocabulary') idsByType.vocabulary.add(item.id);
    else if (item.content_type === 'kanji') idsByType.kanji.add(item.id);
    else if (item.content_type === 'grammar') idsByType.grammar.add(item.id);
  }

  // Batch load published translations for non-English locales
  const translations: Map<string, Record<string, unknown>> = new Map();
  if (locale !== 'en') {
    const results = await Promise.all([
      idsByType.vocabulary.size
        ? client
            .from('vocab_translations')
            .select('content_item_id,meanings,examples')
            .in('content_item_id', [...idsByType.vocabulary])
            .eq('locale', locale)
            .eq('status', 'published')
        : Promise.resolve({ data: [], error: null }),
      idsByType.kanji.size
        ? client
            .from('kanji_translations')
            .select('content_item_id,meanings')
            .in('content_item_id', [...idsByType.kanji])
            .eq('locale', locale)
            .eq('status', 'published')
        : Promise.resolve({ data: [], error: null }),
      idsByType.grammar.size
        ? client
            .from('grammar_translations')
            .select('content_item_id,meaning,formation,examples,tags,notes')
            .in('content_item_id', [...idsByType.grammar])
            .eq('locale', locale)
            .eq('status', 'published')
        : Promise.resolve({ data: [], error: null }),
    ]);

    for (const result of results) {
      if (result.error) continue;
      for (const row of result.data ?? []) {
        translations.set(row.content_item_id, row);
      }
    }
  }

  return sorted.map((item) => {
    const base = toCatalogItem(item, maps);
    const translated = translations.get(item.id) as Awaited<ReturnType<typeof getPublishedTranslation>> | undefined;
    const meanings = translated?.meanings ?? base.meanings;
    const isFallback = locale !== 'en' && !translated;
    const editorial = maps.editorial.get(item.id);

    if (item.content_type === 'vocabulary') {
      const version = maps.vocabulary.get(item.id);
      return {
        ...base,
        type: 'vocabulary' as const,
        meanings,
        examples: translated?.examples
          ? parseExamples(translated.examples)
          : editorial
            ? parseExamples(editorial.examples)
            : version
              ? parseExamples(version.examples)
              : [],
        locale,
        isFallback,
      } as ContentDetail;
    }

    if (item.content_type === 'kanji') {
      const version = maps.kanji.get(item.id);
      return {
        ...base,
        type: 'kanji' as const,
        meanings,
        examples: [],
        onyomi: editorial?.onyomi ?? version?.onyomi ?? [],
        kunyomi: editorial?.kunyomi ?? version?.kunyomi ?? [],
        strokes: editorial?.strokes ?? version?.strokes ?? null,
        grade: editorial?.grade ?? version?.grade ?? null,
        frequency: editorial?.frequency ?? version?.frequency ?? null,
        locale,
        isFallback,
      } as ContentDetail;
    }

    const version = maps.grammar.get(item.id);
    return {
      ...base,
      type: 'grammar' as const,
      meanings,
      examples: translated?.examples
        ? parseExamples(translated.examples)
        : editorial
          ? parseExamples(editorial.examples)
          : version
            ? parseExamples(version.examples)
            : [],
      formation: translated?.formation ?? editorial?.formation ?? version?.formation ?? '',
      tags: translated?.tags ?? editorial?.tags ?? version?.tags ?? [],
      notes: translated?.notes ?? editorial?.notes ?? version?.notes ?? '',
      locale,
      isFallback,
    } as ContentDetail;
  });
}

/** Batch variant: cache keyed by joined IDs + locale. Loads at most ~25 items in one pass. */
const MAX_BATCH_SIZE = 25;
export async function getContentDetailsBatch(
  ids: string[],
  locale: Locale,
): Promise<ContentDetail[]> {
  if (ids.length === 0) return [];
  const uniqueIds = [...new Set(ids)].slice(0, MAX_BATCH_SIZE);
  const key = `batch:${uniqueIds.sort().join(',')}:${locale}`;
  return unstable_cache(
    () => getContentDetailsBatchUncached(uniqueIds, locale),
    ['catalog-detail-batch', key],
    { revalidate: 300, tags: ['catalog', ...uniqueIds.map((id) => `content:${id}`)] },
  )();
}
