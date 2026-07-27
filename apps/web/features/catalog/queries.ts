import { notFound } from 'next/navigation';

import {
  type CatalogItem,
  type CatalogQuery,
  type CatalogResult,
  type ContentDetail,
  type ContentType,
  type Locale,
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

  const [vocabResult, kanjiResult, grammarResult] = await Promise.all([
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
  ]);

  const error = vocabResult.error ?? kanjiResult.error ?? grammarResult.error;
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

  return maps;
}

function toCatalogItem(
  item: ContentItemRow,
  maps: Awaited<ReturnType<typeof getVersionMaps>>,
): CatalogItem {
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
  };
}

export async function getCatalog(query: CatalogQuery): Promise<CatalogResult> {
  const client = createPublicClient();
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, query.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = client
    .from('content_items')
    .select('id,content_type,level,word,reading,character,pattern', {
      count: 'exact',
    })
    .eq('is_active', true)
    .eq('level', query.level);

  if (query.type !== 'all') request = request.eq('content_type', query.type);

  const search = cleanSearchTerm(query.search);
  if (search) {
    request = request.or(
      `word.ilike.%${search}%,reading.ilike.%${search}%,character.ilike.%${search}%,pattern.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await request
    .order('content_type')
    .order('identity_key')
    .range(from, to);

  if (error) throw new Error(`Unable to load catalog: ${error.message}`);

  const maps = await getVersionMaps(data);
  const total = count ?? 0;

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
): Promise<string[] | string | null> {
  const client = createPublicClient();

  if (type === 'grammar') {
    const { data } = await client
      .from('grammar_translations')
      .select('meaning')
      .eq('content_item_id', contentItemId)
      .eq('locale', locale)
      .eq('status', 'published')
      .maybeSingle();
    return data?.meaning ?? null;
  }

  const table = type === 'vocabulary' ? 'vocab_translations' : 'kanji_translations';
  const { data } = await client
    .from(table)
    .select('meanings')
    .eq('content_item_id', contentItemId)
    .eq('locale', locale)
    .eq('status', 'published')
    .maybeSingle();
  return data?.meanings ?? null;
}

export async function getContentDetail(
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
  const translatedMeanings =
    typeof translated === 'string' ? [translated] : translated;
  const meanings = translatedMeanings ?? base.meanings;
  const isFallback = locale !== 'en' && translated === null;

  if (item.content_type === 'vocabulary') {
    const version = maps.vocabulary.get(item.id);
    return {
      ...base,
      type: 'vocabulary',
      meanings,
      examples: version ? parseExamples(version.examples) : [],
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
      onyomi: version?.onyomi ?? [],
      kunyomi: version?.kunyomi ?? [],
      strokes: version?.strokes ?? null,
      grade: version?.grade ?? null,
      frequency: version?.frequency ?? null,
      locale,
      isFallback,
    };
  }

  const version = maps.grammar.get(item.id);
  return {
    ...base,
    type: 'grammar',
    meanings,
    examples: version ? parseExamples(version.examples) : [],
    formation: version?.formation ?? '',
    tags: version?.tags ?? [],
    notes: version?.notes ?? '',
    locale,
    isFallback,
  };
}
