create function public.get_learning_candidates(
  p_level public.jlpt_level,
  p_content_type public.content_type,
  p_parts_of_speech public.vocabulary_part_of_speech[],
  p_verb_groups public.vocabulary_verb_group[],
  p_transitivities public.vocabulary_transitivity[],
  p_adjective_types public.vocabulary_adjective_type[],
  p_themes public.vocabulary_theme[],
  p_limit integer
)
returns table (content_item_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select content.id as content_item_id
  from public.content_items as content
  left join public.vocabulary_taxonomy as taxonomy
    on taxonomy.content_item_id = content.id
  where (select auth.uid()) is not null
    and content.is_active
    and content.level = p_level
    and content.content_type = p_content_type
    and not exists (
      select 1
      from public.learning_progress as progress
      where progress.user_id = (select auth.uid())
        and progress.content_item_id = content.id
    )
    and (
      p_content_type <> 'vocabulary'
      or (
        (
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
          (
            cardinality(coalesce(p_parts_of_speech, '{}'))
            + cardinality(coalesce(p_verb_groups, '{}'))
            + cardinality(coalesce(p_transitivities, '{}'))
            + cardinality(coalesce(p_adjective_types, '{}'))
            + cardinality(coalesce(p_themes, '{}'))
          ) = 0
          or not taxonomy.needs_review
        )
      )
    )
  order by content.identity_key
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_learning_candidates(
  public.jlpt_level,
  public.content_type,
  public.vocabulary_part_of_speech[],
  public.vocabulary_verb_group[],
  public.vocabulary_transitivity[],
  public.vocabulary_adjective_type[],
  public.vocabulary_theme[],
  integer
) from public, anon;

grant execute on function public.get_learning_candidates(
  public.jlpt_level,
  public.content_type,
  public.vocabulary_part_of_speech[],
  public.vocabulary_verb_group[],
  public.vocabulary_transitivity[],
  public.vocabulary_adjective_type[],
  public.vocabulary_theme[],
  integer
) to authenticated;
