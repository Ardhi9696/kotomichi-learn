begin;

create type public.vocabulary_part_of_speech as enum (
  'noun',
  'verb',
  'adjective',
  'other'
);

create type public.vocabulary_verb_group as enum (
  'godan',
  'ichidan',
  'irregular'
);

create type public.vocabulary_transitivity as enum (
  'transitive',
  'intransitive'
);

create type public.vocabulary_adjective_type as enum (
  'i',
  'na'
);

create type public.vocabulary_theme as enum (
  'numbers_units',
  'self_family',
  'time_weather',
  'daily_life',
  'food_drink',
  'school_work',
  'travel_places',
  'nature_health',
  'communication_feelings'
);

create table public.vocabulary_taxonomy (
  content_item_id uuid primary key
    references public.content_items(id) on delete cascade,
  parts_of_speech public.vocabulary_part_of_speech[] not null default '{}',
  verb_groups public.vocabulary_verb_group[] not null default '{}',
  transitivities public.vocabulary_transitivity[] not null default '{}',
  adjective_types public.vocabulary_adjective_type[] not null default '{}',
  themes public.vocabulary_theme[] not null default '{}',
  classification_source text not null default 'editorial',
  source_reference text,
  confidence numeric(3, 2) not null default 1,
  needs_review boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocabulary_taxonomy_source_not_blank
    check (btrim(classification_source) <> ''),
  constraint vocabulary_taxonomy_confidence_range
    check (confidence >= 0 and confidence <= 1),
  constraint vocabulary_taxonomy_verb_dimensions
    check (
      'verb' = any(parts_of_speech)
      or (cardinality(verb_groups) = 0 and cardinality(transitivities) = 0)
    ),
  constraint vocabulary_taxonomy_adjective_dimensions
    check (
      'adjective' = any(parts_of_speech)
      or cardinality(adjective_types) = 0
    )
);

comment on table public.vocabulary_taxonomy is
  'Multi-dimensional vocabulary classification. Initial automated coverage is limited to JLPT N5/N4 and remains reviewable.';

create index vocabulary_taxonomy_parts_of_speech_idx
  on public.vocabulary_taxonomy using gin (parts_of_speech);
create index vocabulary_taxonomy_verb_groups_idx
  on public.vocabulary_taxonomy using gin (verb_groups);
create index vocabulary_taxonomy_transitivities_idx
  on public.vocabulary_taxonomy using gin (transitivities);
create index vocabulary_taxonomy_adjective_types_idx
  on public.vocabulary_taxonomy using gin (adjective_types);
create index vocabulary_taxonomy_themes_idx
  on public.vocabulary_taxonomy using gin (themes);
create index vocabulary_taxonomy_review_queue_idx
  on public.vocabulary_taxonomy (needs_review, confidence, updated_at)
  where needs_review;

create trigger vocabulary_taxonomy_set_updated_at
before update on public.vocabulary_taxonomy
for each row execute function public.set_updated_at();

alter table public.vocabulary_taxonomy enable row level security;

grant select on public.vocabulary_taxonomy to anon, authenticated;
grant insert, update, delete on public.vocabulary_taxonomy to authenticated;

create policy vocabulary_taxonomy_anon_select
on public.vocabulary_taxonomy
for select
to anon
using (
  exists (
    select 1
    from public.content_items
    where id = content_item_id
      and content_type = 'vocabulary'
      and is_active
  )
);

create policy vocabulary_taxonomy_authenticated_select
on public.vocabulary_taxonomy
for select
to authenticated
using (
  exists (
    select 1
    from public.content_items
    where id = content_item_id
      and content_type = 'vocabulary'
      and (
        is_active
        or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
      )
  )
);

create policy vocabulary_taxonomy_editor_insert
on public.vocabulary_taxonomy
for insert
to authenticated
with check (
  private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
  and exists (
    select 1
    from public.content_items
    where id = content_item_id
      and content_type = 'vocabulary'
  )
);

create policy vocabulary_taxonomy_editor_update
on public.vocabulary_taxonomy
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (
  private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
  and exists (
    select 1
    from public.content_items
    where id = content_item_id
      and content_type = 'vocabulary'
  )
);

create policy vocabulary_taxonomy_editor_delete
on public.vocabulary_taxonomy
for delete
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create function public.save_vocabulary_taxonomy(
  p_content_item_id uuid,
  p_parts_of_speech public.vocabulary_part_of_speech[],
  p_verb_groups public.vocabulary_verb_group[],
  p_transitivities public.vocabulary_transitivity[],
  p_adjective_types public.vocabulary_adjective_type[],
  p_themes public.vocabulary_theme[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]) then
    raise exception 'Editorial access required';
  end if;

  if not exists (
    select 1
    from public.content_items
    where id = p_content_item_id
      and content_type = 'vocabulary'
  ) then
    raise exception 'Vocabulary item not found';
  end if;

  insert into public.vocabulary_taxonomy (
    content_item_id,
    parts_of_speech,
    verb_groups,
    transitivities,
    adjective_types,
    themes,
    classification_source,
    confidence,
    needs_review,
    reviewed_by,
    reviewed_at
  )
  values (
    p_content_item_id,
    coalesce(p_parts_of_speech, '{}'),
    coalesce(p_verb_groups, '{}'),
    coalesce(p_transitivities, '{}'),
    coalesce(p_adjective_types, '{}'),
    coalesce(p_themes, '{}'),
    'editorial',
    1,
    false,
    (select auth.uid()),
    now()
  )
  on conflict (content_item_id)
  do update set
    parts_of_speech = excluded.parts_of_speech,
    verb_groups = excluded.verb_groups,
    transitivities = excluded.transitivities,
    adjective_types = excluded.adjective_types,
    themes = excluded.themes,
    classification_source = excluded.classification_source,
    confidence = excluded.confidence,
    needs_review = excluded.needs_review,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at;

  return true;
end;
$$;

revoke all on function public.save_vocabulary_taxonomy(
  uuid,
  public.vocabulary_part_of_speech[],
  public.vocabulary_verb_group[],
  public.vocabulary_transitivity[],
  public.vocabulary_adjective_type[],
  public.vocabulary_theme[]
) from public, anon;

grant execute on function public.save_vocabulary_taxonomy(
  uuid,
  public.vocabulary_part_of_speech[],
  public.vocabulary_verb_group[],
  public.vocabulary_transitivity[],
  public.vocabulary_adjective_type[],
  public.vocabulary_theme[]
) to authenticated;

create function public.browse_catalog_items(
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
    matches.content_item_id,
    count(*) over () as total_count
  from matches
  order by matches.content_type, matches.identity_key
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.browse_catalog_items(
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
) from public;

grant execute on function public.browse_catalog_items(
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

commit;
