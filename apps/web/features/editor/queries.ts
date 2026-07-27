import type {
  ContentType,
  Level,
  VocabularyAdjectiveType,
  VocabularyPartOfSpeech,
  VocabularyTheme,
  VocabularyTransitivity,
  VocabularyVerbGroup,
} from '@/features/catalog/types';
import { parseExamples } from '@/features/catalog/types';
import { requireEditorial } from '@/lib/auth/require-editorial';
import type { Json, Tables } from '@/lib/supabase/database.types';

export type EditorCatalogQuery = {
  level: Level;
  type: ContentType | 'all';
  search: string;
  includeArchived: boolean;
};

export type EditorCatalogItem = {
  id: string;
  type: ContentType;
  level: Level;
  title: string;
  reading: string;
  isActive: boolean;
  origin: string;
  hasOverride: boolean;
};

export type EditorContentFormData = {
  id: string | null;
  type: ContentType;
  level: Level;
  title: string;
  reading: string;
  meanings: string;
  examples: string;
  formation: string;
  tags: string;
  notes: string;
  onyomi: string;
  kunyomi: string;
  strokes: string;
  grade: string;
  frequency: string;
  isActive: boolean;
  origin: string;
  partsOfSpeech: VocabularyPartOfSpeech[];
  verbGroups: VocabularyVerbGroup[];
  transitivities: VocabularyTransitivity[];
  adjectiveTypes: VocabularyAdjectiveType[];
  themes: VocabularyTheme[];
};

type ContentIdentity = Pick<
  Tables<'content_items'>,
  | 'id'
  | 'content_type'
  | 'level'
  | 'word'
  | 'reading'
  | 'character'
  | 'pattern'
  | 'current_snapshot_id'
  | 'is_active'
  | 'content_origin'
>;

function cleanSearchTerm(value: string): string {
  return value.trim().replaceAll(/[,%()]/g, '').slice(0, 80);
}

function identityTitle(item: ContentIdentity): string {
  return item.word ?? item.character ?? item.pattern ?? '';
}

function serializeExamples(value: Json): string {
  return parseExamples(value)
    .map((example) => `${example.ja} | ${example.en}`)
    .join('\n');
}

export async function getEditorCatalog(
  filters: EditorCatalogQuery,
): Promise<EditorCatalogItem[]> {
  const { supabase } = await requireEditorial();
  let query = supabase
    .from('content_items')
    .select(
      'id,content_type,level,word,reading,character,pattern,current_snapshot_id,is_active,content_origin',
    )
    .eq('level', filters.level)
    .order('content_type')
    .order('identity_key')
    .limit(100);

  if (filters.type !== 'all') query = query.eq('content_type', filters.type);
  if (!filters.includeArchived) query = query.eq('is_active', true);
  const search = cleanSearchTerm(filters.search);
  if (search) {
    query = query.or(
      `word.ilike.%${search}%,reading.ilike.%${search}%,character.ilike.%${search}%,pattern.ilike.%${search}%`,
    );
  }

  const { data: items, error } = await query;
  if (error) throw new Error('Daftar materi editor belum dapat dimuat.');
  if (!items.length) return [];

  const { data: overrides, error: overrideError } = await supabase
    .from('editorial_content_details')
    .select('content_item_id,title,reading')
    .in(
      'content_item_id',
      items.map((item) => item.id),
    );
  if (overrideError) throw new Error('Override editorial belum dapat dimuat.');
  const overrideMap = new Map(
    (overrides ?? []).map((override) => [override.content_item_id, override]),
  );

  return items.map((item) => {
    const override = overrideMap.get(item.id);
    return {
      id: item.id,
      type: item.content_type,
      level: item.level,
      title: override?.title ?? identityTitle(item),
      reading: override?.reading ?? item.reading ?? '',
      isActive: item.is_active,
      origin: item.content_origin,
      hasOverride: Boolean(override),
    };
  });
}

export async function getEditorContent(id: string): Promise<EditorContentFormData> {
  const { supabase } = await requireEditorial();
  const { data: item, error } = await supabase
    .from('content_items')
    .select(
      'id,content_type,level,word,reading,character,pattern,current_snapshot_id,is_active,content_origin',
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !item) throw new Error('Materi editor tidak ditemukan.');

  const { data: override, error: overrideError } = await supabase
    .from('editorial_content_details')
    .select(
      'title,reading,meanings,examples,formation,tags,notes,onyomi,kunyomi,strokes,grade,frequency',
    )
    .eq('content_item_id', id)
    .maybeSingle();
  if (overrideError) throw new Error('Override editorial belum dapat dimuat.');

  const { data: taxonomy, error: taxonomyError } = await supabase
    .from('vocabulary_taxonomy')
    .select('parts_of_speech,verb_groups,transitivities,adjective_types,themes')
    .eq('content_item_id', id)
    .maybeSingle();
  if (taxonomyError) throw new Error('Klasifikasi kosakata belum dapat dimuat.');

  let base:
    | Pick<
        Tables<'vocab'>,
        'meanings' | 'examples' | 'reading'
      >
    | Pick<
        Tables<'kanji'>,
        'meanings' | 'onyomi' | 'kunyomi' | 'strokes' | 'grade' | 'frequency'
      >
    | Pick<
        Tables<'grammar'>,
        'meaning' | 'examples' | 'formation' | 'tags' | 'notes'
      >
    | null = null;

  if (!override && item.current_snapshot_id) {
    if (item.content_type === 'vocabulary') {
      const { data, error: baseError } = await supabase
        .from('vocab')
        .select('meanings,examples,reading')
        .eq('content_item_id', id)
        .eq('snapshot_id', item.current_snapshot_id)
        .maybeSingle();
      if (baseError) throw new Error('Sumber kosakata belum dapat dimuat.');
      base = data;
    } else if (item.content_type === 'kanji') {
      const { data, error: baseError } = await supabase
        .from('kanji')
        .select('meanings,onyomi,kunyomi,strokes,grade,frequency')
        .eq('content_item_id', id)
        .eq('snapshot_id', item.current_snapshot_id)
        .maybeSingle();
      if (baseError) throw new Error('Sumber kanji belum dapat dimuat.');
      base = data;
    } else {
      const { data, error: baseError } = await supabase
        .from('grammar')
        .select('meaning,examples,formation,tags,notes')
        .eq('content_item_id', id)
        .eq('snapshot_id', item.current_snapshot_id)
        .maybeSingle();
      if (baseError) throw new Error('Sumber tata bahasa belum dapat dimuat.');
      base = data;
    }
  }

  const meanings =
    override?.meanings ??
    (base && 'meanings' in base
      ? base.meanings
      : base && 'meaning' in base
        ? [base.meaning]
        : []);
  const examples =
    override?.examples ?? (base && 'examples' in base ? base.examples : []);

  return {
    id: item.id,
    type: item.content_type,
    level: item.level,
    title: override?.title ?? identityTitle(item),
    reading:
      override?.reading ??
      (base && 'reading' in base ? base.reading : item.reading ?? ''),
    meanings: meanings.join('\n'),
    examples: serializeExamples(examples),
    formation:
      override?.formation ?? (base && 'formation' in base ? base.formation : ''),
    tags: (override?.tags ?? (base && 'tags' in base ? base.tags : [])).join(', '),
    notes: override?.notes ?? (base && 'notes' in base ? base.notes : ''),
    onyomi: (
      override?.onyomi ?? (base && 'onyomi' in base ? base.onyomi : [])
    ).join(', '),
    kunyomi: (
      override?.kunyomi ?? (base && 'kunyomi' in base ? base.kunyomi : [])
    ).join(', '),
    strokes: String(
      override?.strokes ?? (base && 'strokes' in base ? base.strokes : '') ?? '',
    ),
    grade: String(
      override?.grade ?? (base && 'grade' in base ? base.grade : '') ?? '',
    ),
    frequency: String(
      override?.frequency ??
        (base && 'frequency' in base ? base.frequency : '') ??
        '',
    ),
    isActive: item.is_active,
    origin: item.content_origin,
    partsOfSpeech: taxonomy?.parts_of_speech ?? [],
    verbGroups: taxonomy?.verb_groups ?? [],
    transitivities: taxonomy?.transitivities ?? [],
    adjectiveTypes: taxonomy?.adjective_types ?? [],
    themes: taxonomy?.themes ?? [],
  };
}

export function emptyEditorContent(): EditorContentFormData {
  return {
    id: null,
    type: 'vocabulary',
    level: 'N5',
    title: '',
    reading: '',
    meanings: '',
    examples: '',
    formation: '',
    tags: '',
    notes: '',
    onyomi: '',
    kunyomi: '',
    strokes: '',
    grade: '',
    frequency: '',
    isActive: true,
    origin: 'editorial',
    partsOfSpeech: ['noun'],
    verbGroups: [],
    transitivities: [],
    adjectiveTypes: [],
    themes: [],
  };
}
