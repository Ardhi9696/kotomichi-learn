create function public.browse_catalog_items_with_details(
  p_level public.jlpt_level,
  p_content_type public.content_type,
  p_search text,
  p_parts_of_speech public.vocabulary_part_of_speech[],
  p_verb_groups public.vocabulary_verb_group[],
  p_transitivities public.vocabulary_transitivity[],
  p_adjective_types public.vocabulary_adjective_type[],
  p_themes public.vocabulary_theme[],
  p_offset integer,
  p_limit integer
)
returns table (
  content_item_id uuid,
  total_count bigint,
  item_word text,
  item_reading text,
  item_character text,
  item_pattern text,
  content_type public.content_type,
  level public.jlpt_level,
  vocab_word text,
  vocab_reading text,
  vocab_meanings text[],
  vocab_examples jsonb,
  kanji_char text,
  kanji_meanings text[],
  kanji_onyomi text[],
  kanji_kunyomi text[],
  kanji_strokes smallint,
  kanji_grade smallint,
  kanji_frequency real,
  grammar_pattern text,
  grammar_meaning text,
  grammar_formation text,
  grammar_examples jsonb,
  grammar_tags text[],
  grammar_notes text,
  editorial_title text,
  editorial_reading text,
  editorial_meanings text[],
  editorial_examples jsonb,
  editorial_formation text,
  editorial_tags text[],
  editorial_notes text,
  editorial_onyomi text[],
  editorial_kunyomi text[],
  editorial_strokes smallint,
  editorial_grade smallint,
  editorial_frequency real,
  taxonomy_parts_of_speech public.vocabulary_part_of_speech[],
  taxonomy_verb_groups public.vocabulary_verb_group[],
  taxonomy_transitivities public.vocabulary_transitivity[],
  taxonomy_adjective_types public.vocabulary_adjective_type[],
  taxonomy_themes public.vocabulary_theme[],
  taxonomy_needs_review boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with matches as materialized (
    select
      content_item.id as content_item_id,
      content_item.word as item_word,
      content_item.reading as item_reading,
      content_item.character as item_character,
      content_item.pattern as item_pattern,
      content_item.content_type,
      content_item.level,
      vocabulary.word as vocab_word,
      vocabulary.reading as vocab_reading,
      vocabulary.meanings as vocab_meanings,
      vocabulary.examples as vocab_examples,
      kanji.character as kanji_char,
      kanji.meanings as kanji_meanings,
      kanji.onyomi as kanji_onyomi,
      kanji.kunyomi as kanji_kunyomi,
      kanji.strokes as kanji_strokes,
      kanji.grade as kanji_grade,
      kanji.frequency as kanji_frequency,
      grammar.pattern as grammar_pattern,
      grammar.meaning as grammar_meaning,
      grammar.formation as grammar_formation,
      grammar.examples as grammar_examples,
      grammar.tags as grammar_tags,
      grammar.notes as grammar_notes,
      editorial.title as editorial_title,
      editorial.reading as editorial_reading,
      editorial.meanings as editorial_meanings,
      editorial.examples as editorial_examples,
      editorial.formation as editorial_formation,
      editorial.tags as editorial_tags,
      editorial.notes as editorial_notes,
      editorial.onyomi as editorial_onyomi,
      editorial.kunyomi as editorial_kunyomi,
      editorial.strokes as editorial_strokes,
      editorial.grade as editorial_grade,
      editorial.frequency as editorial_frequency,
      taxonomy.parts_of_speech as taxonomy_parts_of_speech,
      taxonomy.verb_groups as taxonomy_verb_groups,
      taxonomy.transitivities as taxonomy_transitivities,
      taxonomy.adjective_types as taxonomy_adjective_types,
      taxonomy.themes as taxonomy_themes,
      taxonomy.needs_review as taxonomy_needs_review
    from public.content_items as content_item
    left join public.vocab as vocabulary
      on vocabulary.content_item_id = content_item.id
      and vocabulary.snapshot_id = content_item.current_snapshot_id
    left join public.kanji as kanji
      on kanji.content_item_id = content_item.id
      and kanji.snapshot_id = content_item.current_snapshot_id
    left join public.grammar as grammar
      on grammar.content_item_id = content_item.id
      and grammar.snapshot_id = content_item.current_snapshot_id
    left join public.editorial_content_details as editorial
      on editorial.content_item_id = content_item.id
    left join public.vocabulary_taxonomy as taxonomy
      on taxonomy.content_item_id = content_item.id
    where content_item.is_active
      and content_item.level = p_level
      and (p_content_type is null or content_item.content_type = p_content_type)
      and (
        cardinality(coalesce(p_parts_of_speech, '{}')) = 0
        or taxonomy.parts_of_speech && p_parts_of_speech
      )
      and (
        cardinality(coalesce(p_verb_groups, '{}')) = 0
        or taxonomy.verb_groups && p_verb_groups
      )
      and (
        cardinality(coalesce(p_transitivities, '{}')) = 0
        or taxonomy.transitivities && p_transitivities
      )
      and (
        cardinality(coalesce(p_adjective_types, '{}')) = 0
        or taxonomy.adjective_types && p_adjective_types
      )
      and (
        cardinality(coalesce(p_themes, '{}')) = 0
        or taxonomy.themes && p_themes
      )
      and (
        btrim(coalesce(p_search, '')) = ''
        or content_item.word ilike '%' || left(p_search, 80) || '%'
        or content_item.reading ilike '%' || left(p_search, 80) || '%'
        or content_item.character ilike '%' || left(p_search, 80) || '%'
        or content_item.pattern ilike '%' || left(p_search, 80) || '%'
        or editorial.title ilike '%' || left(p_search, 80) || '%'
        or editorial.reading ilike '%' || left(p_search, 80) || '%'
        or array_to_string(editorial.meanings, ' ') ilike '%' || left(p_search, 80) || '%'
        or vocabulary.word ilike '%' || left(p_search, 80) || '%'
        or vocabulary.reading ilike '%' || left(p_search, 80) || '%'
        or array_to_string(vocabulary.meanings, ' ') ilike '%' || left(p_search, 80) || '%'
        or kanji.character ilike '%' || left(p_search, 80) || '%'
        or array_to_string(kanji.onyomi, ' ') ilike '%' || left(p_search, 80) || '%'
        or array_to_string(kanji.kunyomi, ' ') ilike '%' || left(p_search, 80) || '%'
        or array_to_string(kanji.meanings, ' ') ilike '%' || left(p_search, 80) || '%'
        or grammar.pattern ilike '%' || left(p_search, 80) || '%'
        or grammar.meaning ilike '%' || left(p_search, 80) || '%'
        or grammar.formation ilike '%' || left(p_search, 80) || '%'
        or exists (
          select 1
          from public.vocab_translations as translation
          where translation.content_item_id = content_item.id
            and translation.status = 'published'
            and array_to_string(translation.meanings, ' ')
              ilike '%' || left(p_search, 80) || '%'
        )
        or exists (
          select 1
          from public.kanji_translations as translation
          where translation.content_item_id = content_item.id
            and translation.status = 'published'
            and array_to_string(translation.meanings, ' ')
              ilike '%' || left(p_search, 80) || '%'
        )
        or exists (
          select 1
          from public.grammar_translations as translation
          where translation.content_item_id = content_item.id
            and translation.status = 'published'
            and (
              translation.meaning ilike '%' || left(p_search, 80) || '%'
              or translation.formation ilike '%' || left(p_search, 80) || '%'
              or translation.notes ilike '%' || left(p_search, 80) || '%'
              or array_to_string(translation.tags, ' ')
                ilike '%' || left(p_search, 80) || '%'
            )
        )
      )
  )
  select
    m.content_item_id,
    count(*) over () as total_count,
    m.item_word,
    m.item_reading,
    m.item_character,
    m.item_pattern,
    m.content_type,
    m.level,
    m.vocab_word,
    m.vocab_reading,
    m.vocab_meanings,
    m.vocab_examples,
    m.kanji_char,
    m.kanji_meanings,
    m.kanji_onyomi,
    m.kanji_kunyomi,
    m.kanji_strokes,
    m.kanji_grade,
    m.kanji_frequency,
    m.grammar_pattern,
    m.grammar_meaning,
    m.grammar_formation,
    m.grammar_examples,
    m.grammar_tags,
    m.grammar_notes,
    m.editorial_title,
    m.editorial_reading,
    m.editorial_meanings,
    m.editorial_examples,
    m.editorial_formation,
    m.editorial_tags,
    m.editorial_notes,
    m.editorial_onyomi,
    m.editorial_kunyomi,
    m.editorial_strokes,
    m.editorial_grade,
    m.editorial_frequency,
    m.taxonomy_parts_of_speech,
    m.taxonomy_verb_groups,
    m.taxonomy_transitivities,
    m.taxonomy_adjective_types,
    m.taxonomy_themes,
    m.taxonomy_needs_review
  from matches m
  order by m.content_type, m.item_word nulls last, m.item_character nulls last, m.item_pattern nulls last
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.browse_catalog_items_with_details from public;
grant execute on function public.browse_catalog_items_with_details(
  public.jlpt_level,
  public.content_type,
  text,
  public.vocabulary_part_of_speech[],
  public.vocabulary_verb_group[],
  public.vocabulary_transitivity[],
  public.vocabulary_adjective_type[],
  public.vocabulary_theme[],
  integer,
  integer
) to anon, authenticated;
