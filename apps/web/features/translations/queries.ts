import {
  getEditorCatalog,
  getEditorContent,
  type EditorCatalogItem,
} from '@/features/editor/queries';
import type { ContentType, Level } from '@/features/catalog/types';
import { parseExamples } from '@/features/catalog/types';
import { requireEditorial } from '@/lib/auth/require-editorial';
import type { Enums, Json } from '@/lib/supabase/database.types';

export type TranslationLocale = Enums<'translation_locale'>;
export type TranslationListStatus =
  | Enums<'translation_status'>
  | 'missing'
  | 'submitted'
  | 'all';

export type TranslationListItem = EditorCatalogItem & {
  translationStatus: Enums<'translation_status'> | 'missing';
  isSubmitted: boolean;
};

export type TranslationEditorData = {
  source: Awaited<ReturnType<typeof getEditorContent>>;
  locale: TranslationLocale;
  translation: {
    status: Enums<'translation_status'> | 'missing';
    isSubmitted: boolean;
    meanings: string;
    examples: string;
    formation: string;
    tags: string;
    notes: string;
    reviewNotes: string;
  };
  revisions: {
    id: string;
    status: Enums<'translation_status'>;
    operation: string;
    createdAt: string;
  }[];
  canReview: boolean;
};

function serializeExamples(value: Json | undefined): string {
  return parseExamples(value ?? [])
    .map((example) => `${example.ja} | ${example.en}`)
    .join('\n');
}

export async function getTranslationWorkspace(filters: {
  level: Level;
  type: ContentType | 'all';
  search: string;
  locale: TranslationLocale;
  status: TranslationListStatus;
}) {
  const items = await getEditorCatalog({
    level: filters.level,
    type: filters.type,
    search: filters.search,
    includeArchived: false,
  });
  const { supabase } = await requireEditorial();
  const ids = {
    vocabulary: items.filter((item) => item.type === 'vocabulary').map((item) => item.id),
    kanji: items.filter((item) => item.type === 'kanji').map((item) => item.id),
    grammar: items.filter((item) => item.type === 'grammar').map((item) => item.id),
  };
  const [vocabResult, kanjiResult, grammarResult] = await Promise.all([
    ids.vocabulary.length
      ? supabase
          .from('vocab_translations')
          .select('content_item_id,status,submitted_at')
          .eq('locale', filters.locale)
          .in('content_item_id', ids.vocabulary)
      : Promise.resolve({ data: [], error: null }),
    ids.kanji.length
      ? supabase
          .from('kanji_translations')
          .select('content_item_id,status,submitted_at')
          .eq('locale', filters.locale)
          .in('content_item_id', ids.kanji)
      : Promise.resolve({ data: [], error: null }),
    ids.grammar.length
      ? supabase
          .from('grammar_translations')
          .select('content_item_id,status,submitted_at')
          .eq('locale', filters.locale)
          .in('content_item_id', ids.grammar)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (vocabResult.error || kanjiResult.error || grammarResult.error) {
    throw new Error('Status translation belum dapat dimuat.');
  }

  const statusMap = new Map<
    string,
    { status: Enums<'translation_status'>; submitted_at: string | null }
  >();
  for (const row of [
    ...(vocabResult.data ?? []),
    ...(kanjiResult.data ?? []),
    ...(grammarResult.data ?? []),
  ]) {
    statusMap.set(row.content_item_id, row);
  }
  const mapped: TranslationListItem[] = items.map((item) => {
    const translation = statusMap.get(item.id);
    return {
      ...item,
      translationStatus: translation?.status ?? 'missing',
      isSubmitted: Boolean(translation?.submitted_at),
    };
  });
  const filtered = mapped.filter((item) => {
    if (filters.status === 'all') return true;
    if (filters.status === 'submitted') return item.isSubmitted;
    return item.translationStatus === filters.status;
  });

  const contentTypes: ContentType[] =
    filters.type === 'all'
      ? ['vocabulary', 'kanji', 'grammar']
      : [filters.type];
  const coverage = await Promise.all(
    contentTypes.map(async (contentType) => {
      const table =
        contentType === 'vocabulary'
          ? 'vocab_translations'
          : contentType === 'kanji'
            ? 'kanji_translations'
            : 'grammar_translations';
      const [{ count: total }, { count: published }] = await Promise.all([
        supabase
          .from('content_items')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('level', filters.level)
          .eq('content_type', contentType),
        supabase
          .from(table)
          .select('id,content_items!inner(level)', { count: 'exact', head: true })
          .eq('locale', filters.locale)
          .eq('status', 'published')
          .eq('content_items.level', filters.level),
      ]);
      return { contentType, total: total ?? 0, published: published ?? 0 };
    }),
  );

  return { items: filtered, coverage };
}

export async function getTranslationEditor(
  id: string,
  locale: TranslationLocale,
): Promise<TranslationEditorData> {
  const source = await getEditorContent(id);
  const { supabase, canReviewTranslations } = await requireEditorial();
  let translation:
    | {
        status: Enums<'translation_status'>;
        submitted_at: string | null;
        meanings?: string[];
        meaning?: string;
        examples?: Json;
        formation?: string;
        tags?: string[];
        notes?: string;
        review_notes: string | null;
      }
    | null = null;

  if (source.type === 'vocabulary') {
    const { data, error } = await supabase
      .from('vocab_translations')
      .select('status,submitted_at,meanings,examples,review_notes')
      .eq('content_item_id', id)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw new Error('Draft vocabulary belum dapat dimuat.');
    translation = data;
  } else if (source.type === 'kanji') {
    const { data, error } = await supabase
      .from('kanji_translations')
      .select('status,submitted_at,meanings,review_notes')
      .eq('content_item_id', id)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw new Error('Draft kanji belum dapat dimuat.');
    translation = data;
  } else {
    const { data, error } = await supabase
      .from('grammar_translations')
      .select(
        'status,submitted_at,meaning,formation,examples,tags,notes,review_notes',
      )
      .eq('content_item_id', id)
      .eq('locale', locale)
      .maybeSingle();
    if (error) throw new Error('Draft grammar belum dapat dimuat.');
    translation = data;
  }

  const { data: revisions, error: revisionError } = await supabase
    .from('translation_revisions')
    .select('id,status,operation,created_at')
    .eq('content_item_id', id)
    .eq('content_type', source.type)
    .eq('locale', locale)
    .order('created_at', { ascending: false })
    .limit(10);
  if (revisionError) throw new Error('Riwayat translation belum dapat dimuat.');

  return {
    source,
    locale,
    translation: {
      status: translation?.status ?? 'missing',
      isSubmitted: Boolean(translation?.submitted_at),
      meanings: (
        translation?.meanings ??
        (translation?.meaning ? [translation.meaning] : [])
      ).join('\n'),
      examples: serializeExamples(translation?.examples),
      formation: translation?.formation ?? '',
      tags: (translation?.tags ?? []).join(', '),
      notes: translation?.notes ?? '',
      reviewNotes: translation?.review_notes ?? '',
    },
    revisions: (revisions ?? []).map((revision) => ({
      id: revision.id,
      status: revision.status,
      operation: revision.operation,
      createdAt: revision.created_at,
    })),
    canReview: canReviewTranslations,
  };
}
