begin;

drop policy vocab_authenticated_select on public.vocab;
create policy vocab_authenticated_select
on public.vocab for select to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = vocab.content_item_id
      and content_items.current_snapshot_id = vocab.snapshot_id
      and (
        content_items.is_active
        or exists (
          select 1 from public.learning_progress
          where learning_progress.content_item_id = content_items.id
            and learning_progress.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.learning_session_items
          where learning_session_items.content_item_id = content_items.id
            and learning_session_items.user_id = (select auth.uid())
        )
      )
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

drop policy kanji_authenticated_select on public.kanji;
create policy kanji_authenticated_select
on public.kanji for select to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = kanji.content_item_id
      and content_items.current_snapshot_id = kanji.snapshot_id
      and (
        content_items.is_active
        or exists (
          select 1 from public.learning_progress
          where learning_progress.content_item_id = content_items.id
            and learning_progress.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.learning_session_items
          where learning_session_items.content_item_id = content_items.id
            and learning_session_items.user_id = (select auth.uid())
        )
      )
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

drop policy grammar_authenticated_select on public.grammar;
create policy grammar_authenticated_select
on public.grammar for select to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = grammar.content_item_id
      and content_items.current_snapshot_id = grammar.snapshot_id
      and (
        content_items.is_active
        or exists (
          select 1 from public.learning_progress
          where learning_progress.content_item_id = content_items.id
            and learning_progress.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.learning_session_items
          where learning_session_items.content_item_id = content_items.id
            and learning_session_items.user_id = (select auth.uid())
        )
      )
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

drop policy editorial_content_details_authenticated_select
  on public.editorial_content_details;
create policy editorial_content_details_authenticated_select
on public.editorial_content_details for select to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = content_item_id
      and (
        content_items.is_active
        or exists (
          select 1 from public.learning_progress
          where learning_progress.content_item_id = content_items.id
            and learning_progress.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.learning_session_items
          where learning_session_items.content_item_id = content_items.id
            and learning_session_items.user_id = (select auth.uid())
        )
      )
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

drop function public.get_deck_learning_candidates(
  uuid,
  public.vocabulary_adjective_type[],
  integer
);

create function public.get_deck_learning_candidates(
  p_deck_id uuid,
  p_level public.jlpt_level,
  p_adjective_types public.vocabulary_adjective_type[],
  p_limit integer
)
returns table (content_item_id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select content.id
  from public.content_items as content
  left join public.vocabulary_taxonomy as taxonomy
    on taxonomy.content_item_id = content.id
  where content.deck_id = p_deck_id
    and content.level = p_level
    and content.content_origin = 'deck'
    and content.is_active
    and content.archived_at is null
    and (
      cardinality(coalesce(p_adjective_types, '{}')) = 0
      or taxonomy.adjective_types && p_adjective_types
    )
    and not exists (
      select 1 from public.learning_progress as progress
      where progress.user_id = (select auth.uid())
        and progress.content_item_id = content.id
    )
  order by content.external_id
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.get_deck_learning_candidates(
  uuid,
  public.jlpt_level,
  public.vocabulary_adjective_type[],
  integer
) from public, anon;
grant execute on function public.get_deck_learning_candidates(
  uuid,
  public.jlpt_level,
  public.vocabulary_adjective_type[],
  integer
) to authenticated;

commit;
