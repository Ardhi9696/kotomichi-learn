import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';

import {
  type CatalogItem,
  type CatalogQuery,
  type CatalogResult,
  type ContentDetail,
  type ContentType,
  type Locale,
  type VocabularyTaxonomy,
  parseExamples,
} from '@/features/catalog/types';
import type { Tables } from '@/lib/supabase/database.types';
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

const DEFAULT_PAGE_SIZE = 24;

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
  if (error) throw new Error(`Unable to load OpenJLPT content: ${error.message}`);

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

async function getCatalogUncached(query: CatalogQuery): Promise<CatalogResult> {
  const client = createPublicClient();
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, query.page);
  const from = (page - 1) * pageSize;

  const search = cleanSearchTerm(query.search);
  const usesVocabularyTaxonomy = query.type === 'vocabulary';
  const { data: matches, error: browseError } = await client.rpc(
    'browse_catalog_items',
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

  if (browseError) throw new Error(`Unable to browse catalog: ${browseError.message}`);

  const ids = matches.map((match) => match.content_item_id);
  const total = Number(matches[0]?.total_count ?? 0);
  let data: ContentItemRow[] = [];
  if (ids.length) {
    const { data: matchedItems, error: itemsError } = await client
      .from('content_items')
      .select('id,content_type,level,word,reading,character,pattern')
      .in('id', ids);

    if (itemsError) throw new Error(`Unable to load catalog: ${itemsError.message}`);
    const itemsById = new Map(matchedItems.map((item) => [item.id, item]));
    data = ids.flatMap((id) => {
      const item = itemsById.get(id);
      return item ? [item] : [];
    });
  }

  const maps = await getVersionMaps(data);
  return {
    items: data.map((item) => toCatalogItem(item, maps)),
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
