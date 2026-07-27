begin;

create function public.search_catalog_items(
  p_level public.jlpt_level,
  p_content_type public.content_type,
  p_search text,
  p_offset integer,
  p_limit integer
)
returns table (
  content_item_id uuid,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with matches as materialized (
    select
      content_item.id as content_item_id,
      content_item.content_type,
      content_item.identity_key
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
    where content_item.is_active
      and content_item.level = p_level
      and (p_content_type is null or content_item.content_type = p_content_type)
      and (
        content_item.word ilike '%' || left(p_search, 80) || '%'
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
    matches.content_item_id,
    count(*) over () as total_count
  from matches
  order by matches.content_type, matches.identity_key
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.search_catalog_items(
  public.jlpt_level,
  public.content_type,
  text,
  integer,
  integer
) from public;

grant execute on function public.search_catalog_items(
  public.jlpt_level,
  public.content_type,
  text,
  integer,
  integer
) to anon, authenticated;

commit;
