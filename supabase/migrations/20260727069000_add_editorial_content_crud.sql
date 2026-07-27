alter table public.content_items
  add column content_origin text not null default 'openjlpt',
  alter column first_seen_snapshot_id drop not null,
  alter column last_seen_snapshot_id drop not null,
  add constraint content_items_origin_allowed check (
    content_origin in ('openjlpt', 'editorial')
  ),
  add constraint content_items_origin_snapshots check (
    (
      content_origin = 'openjlpt'
      and first_seen_snapshot_id is not null
      and last_seen_snapshot_id is not null
    )
    or (
      content_origin = 'editorial'
      and current_snapshot_id is null
      and first_seen_snapshot_id is null
      and last_seen_snapshot_id is null
      and current_source_fingerprint is null
    )
  );

create table public.editorial_content_details (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  title text not null,
  reading text not null default '',
  meanings text[] not null,
  examples jsonb not null default '[]'::jsonb,
  formation text not null default '',
  tags text[] not null default '{}',
  notes text not null default '',
  onyomi text[] not null default '{}',
  kunyomi text[] not null default '{}',
  strokes integer,
  grade integer,
  frequency integer,
  editor_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_content_title_not_blank check (btrim(title) <> ''),
  constraint editorial_content_meanings_not_empty check (cardinality(meanings) > 0),
  constraint editorial_content_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint editorial_content_strokes_positive check (strokes is null or strokes > 0),
  constraint editorial_content_grade_positive check (grade is null or grade > 0),
  constraint editorial_content_frequency_positive check (frequency is null or frequency > 0)
);

create index editorial_content_details_editor_idx
  on public.editorial_content_details (editor_id, updated_at desc);

create trigger editorial_content_details_set_updated_at
before update on public.editorial_content_details
for each row execute function public.set_updated_at();

alter table public.editorial_content_details enable row level security;

grant select on public.editorial_content_details to anon, authenticated;
grant insert, update, delete on public.editorial_content_details to authenticated;

grant insert (
  id,
  content_type,
  level,
  identity_key,
  word,
  reading,
  character,
  pattern,
  content_origin,
  is_active
) on public.content_items to authenticated;
grant update (level, is_active) on public.content_items to authenticated;

create policy editorial_content_details_anon_select
on public.editorial_content_details
for select
to anon
using (
  exists (
    select 1
    from public.content_items
    where id = content_item_id
      and is_active
  )
);

create policy editorial_content_details_authenticated_select
on public.editorial_content_details
for select
to authenticated
using (
  exists (
    select 1
    from public.content_items
    where id = content_item_id
      and (
        is_active
        or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
      )
  )
);

create policy editorial_content_details_editor_insert
on public.editorial_content_details
for insert
to authenticated
with check (
  editor_id = (select auth.uid())
  and private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

create policy editorial_content_details_editor_update
on public.editorial_content_details
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (
  editor_id = (select auth.uid())
  and private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

create policy editorial_content_details_editor_delete
on public.editorial_content_details
for delete
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy content_items_editorial_insert
on public.content_items
for insert
to authenticated
with check (
  content_origin = 'editorial'
  and private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

create policy content_items_editorial_update
on public.content_items
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create function public.save_editorial_content(
  p_content_item_id uuid,
  p_content_type public.content_type,
  p_level public.jlpt_level,
  p_title text,
  p_reading text,
  p_meanings text[],
  p_examples jsonb,
  p_formation text,
  p_tags text[],
  p_notes text,
  p_onyomi text[],
  p_kunyomi text[],
  p_strokes integer,
  p_grade integer,
  p_frequency integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_id uuid;
  existing_type public.content_type;
begin
  if not private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]) then
    raise exception 'Editorial access required';
  end if;

  if p_content_item_id is null then
    selected_id := gen_random_uuid();

    insert into public.content_items (
      id,
      content_type,
      level,
      identity_key,
      word,
      reading,
      character,
      pattern,
      content_origin,
      is_active
    )
    values (
      selected_id,
      p_content_type,
      p_level,
      'editorial:' || selected_id::text,
      case when p_content_type = 'vocabulary' then btrim(p_title) end,
      case when p_content_type = 'vocabulary' then btrim(coalesce(p_reading, '')) end,
      case when p_content_type = 'kanji' then btrim(p_title) end,
      case when p_content_type = 'grammar' then btrim(p_title) end,
      'editorial',
      true
    );
  else
    select content_type
    into existing_type
    from public.content_items
    where id = p_content_item_id
    for update;

    if not found then
      raise exception 'Content item not found';
    end if;

    if existing_type <> p_content_type then
      raise exception 'Content type cannot be changed';
    end if;

    selected_id := p_content_item_id;
    update public.content_items
    set level = p_level,
        is_active = true
    where id = selected_id;
  end if;

  insert into public.editorial_content_details (
    content_item_id,
    title,
    reading,
    meanings,
    examples,
    formation,
    tags,
    notes,
    onyomi,
    kunyomi,
    strokes,
    grade,
    frequency,
    editor_id
  )
  values (
    selected_id,
    btrim(p_title),
    btrim(coalesce(p_reading, '')),
    p_meanings,
    p_examples,
    btrim(coalesce(p_formation, '')),
    p_tags,
    btrim(coalesce(p_notes, '')),
    p_onyomi,
    p_kunyomi,
    p_strokes,
    p_grade,
    p_frequency,
    (select auth.uid())
  )
  on conflict (content_item_id)
  do update set
    title = excluded.title,
    reading = excluded.reading,
    meanings = excluded.meanings,
    examples = excluded.examples,
    formation = excluded.formation,
    tags = excluded.tags,
    notes = excluded.notes,
    onyomi = excluded.onyomi,
    kunyomi = excluded.kunyomi,
    strokes = excluded.strokes,
    grade = excluded.grade,
    frequency = excluded.frequency,
    editor_id = excluded.editor_id;

  return selected_id;
end;
$$;

create function public.set_content_active(
  p_content_item_id uuid,
  p_is_active boolean
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

  update public.content_items
  set is_active = p_is_active
  where id = p_content_item_id;

  return found;
end;
$$;

revoke all on function public.save_editorial_content(
  uuid,
  public.content_type,
  public.jlpt_level,
  text,
  text,
  text[],
  jsonb,
  text,
  text[],
  text,
  text[],
  text[],
  integer,
  integer,
  integer
) from public, anon;
grant execute on function public.save_editorial_content(
  uuid,
  public.content_type,
  public.jlpt_level,
  text,
  text,
  text[],
  jsonb,
  text,
  text[],
  text,
  text[],
  text[],
  integer,
  integer,
  integer
) to authenticated;

revoke all on function public.set_content_active(uuid, boolean) from public, anon;
grant execute on function public.set_content_active(uuid, boolean) to authenticated;
