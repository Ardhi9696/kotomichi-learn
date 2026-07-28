begin;

create type public.deck_kind as enum ('official', 'user');
create type public.deck_visibility as enum ('private', 'public');
create type public.deck_review_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.deck_import_status as enum (
  'preview',
  'pending',
  'applied',
  'rejected',
  'failed'
);
create type public.study_direction as enum ('recognition', 'production', 'mixed');
create type public.card_direction as enum ('recognition', 'production');

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete restrict,
  title text not null,
  description text not null default '',
  kind public.deck_kind not null default 'user',
  visibility public.deck_visibility not null default 'private',
  review_status public.deck_review_status not null default 'draft',
  active_import_id uuid,
  rights_attested_at timestamptz,
  rights_attestation text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decks_title_not_blank check (btrim(title) <> ''),
  constraint decks_owner_by_kind check (
    (kind = 'official' and owner_id is null)
    or (kind = 'user' and owner_id is not null)
  ),
  constraint decks_public_approval check (
    visibility = 'private' or review_status = 'approved'
  ),
  constraint decks_public_rights check (
    visibility = 'private'
    or (rights_attested_at is not null and btrim(coalesce(rights_attestation, '')) <> '')
  )
);

create table public.deck_imports (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete restrict,
  imported_by uuid not null references auth.users(id) on delete restrict,
  checksum text not null,
  normalized_payload jsonb not null,
  diff jsonb not null default
    '{"added":0,"changed":0,"removed":0,"unchanged":0}'::jsonb,
  row_errors jsonb not null default '[]'::jsonb,
  row_warnings jsonb not null default '[]'::jsonb,
  status public.deck_import_status not null default 'preview',
  applied_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  constraint deck_imports_checksum_format check (checksum ~ '^[a-f0-9]{64}$'),
  constraint deck_imports_payload_array check (jsonb_typeof(normalized_payload) = 'array'),
  constraint deck_imports_diff_object check (jsonb_typeof(diff) = 'object'),
  constraint deck_imports_errors_array check (jsonb_typeof(row_errors) = 'array'),
  constraint deck_imports_warnings_array check (jsonb_typeof(row_warnings) = 'array'),
  constraint deck_imports_deck_checksum_unique unique (deck_id, checksum)
);

alter table public.decks
  add constraint decks_active_import_fk
  foreign key (active_import_id) references public.deck_imports(id) on delete restrict;

create table public.deck_vocabulary (
  content_item_id uuid primary key references public.content_items(id) on delete restrict,
  deck_id uuid not null references public.decks(id) on delete restrict,
  import_id uuid not null references public.deck_imports(id) on delete restrict,
  external_id text not null,
  display text,
  meanings_id text[] not null,
  meanings_en text[] not null default '{}',
  meanings_ko text[] not null default '{}',
  examples jsonb not null default '[]'::jsonb,
  usage_frame text,
  pair_external_id text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deck_vocabulary_external_id_not_blank check (btrim(external_id) <> ''),
  constraint deck_vocabulary_meanings_id_not_empty check (cardinality(meanings_id) > 0),
  constraint deck_vocabulary_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint deck_vocabulary_deck_external_unique unique (deck_id, external_id)
);

alter table public.content_items
  drop constraint content_items_origin_allowed,
  drop constraint content_items_origin_snapshots,
  add column deck_id uuid references public.decks(id) on delete restrict,
  add column external_id text,
  add column base_locale text not null default 'id',
  add column archived_at timestamptz,
  add constraint content_items_origin_allowed check (
    content_origin in ('openjlpt', 'editorial', 'deck')
  ),
  add constraint content_items_origin_snapshots check (
    (
      content_origin = 'openjlpt'
      and first_seen_snapshot_id is not null
      and last_seen_snapshot_id is not null
      and deck_id is null
      and external_id is null
    )
    or (
      content_origin = 'editorial'
      and current_snapshot_id is null
      and first_seen_snapshot_id is null
      and last_seen_snapshot_id is null
      and current_source_fingerprint is null
      and deck_id is null
      and external_id is null
    )
    or (
      content_origin = 'deck'
      and current_snapshot_id is null
      and first_seen_snapshot_id is null
      and last_seen_snapshot_id is null
      and current_source_fingerprint is null
      and deck_id is not null
      and btrim(coalesce(external_id, '')) <> ''
    )
  ),
  add constraint content_items_base_locale check (base_locale in ('id', 'en', 'ko')),
  add constraint content_items_deck_external_unique unique (deck_id, external_id);

drop index content_items_vocab_identity_idx;
create unique index content_items_legacy_vocab_identity_idx
  on public.content_items (level, word, reading)
  where content_type = 'vocabulary' and deck_id is null;

create index decks_library_idx
  on public.decks (visibility, review_status, updated_at desc)
  where archived_at is null;
create index decks_owner_idx
  on public.decks (owner_id, updated_at desc)
  where archived_at is null;
create index deck_imports_queue_idx
  on public.deck_imports (status, created_at)
  where status = 'pending';
create index deck_imports_deck_idx on public.deck_imports (deck_id, created_at desc);
create index deck_vocabulary_deck_idx on public.deck_vocabulary (deck_id, external_id);
create index content_items_deck_active_idx
  on public.content_items (deck_id, is_active, level)
  where content_origin = 'deck';

alter table public.learning_sessions
  add column deck_id uuid references public.decks(id) on delete restrict,
  add column study_direction public.study_direction not null default 'recognition';

alter table public.learning_session_items
  add column card_direction public.card_direction not null default 'recognition';

alter table public.quiz_attempts
  drop constraint quiz_attempts_question_type,
  add constraint quiz_attempts_question_type check (
    question_type in (
      'flashcard',
      'meaning_choice',
      'reading_choice',
      'recall',
      'sentence_completion',
      'production_recall'
    )
  );

create trigger decks_set_updated_at
before update on public.decks
for each row execute function public.set_updated_at();

create trigger deck_vocabulary_set_updated_at
before update on public.deck_vocabulary
for each row execute function public.set_updated_at();

create function private.guard_deck_review_gate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.owner_id = (select auth.uid())
    and not private.has_any_role(
      array['reviewer', 'admin', 'superadmin']::public.app_role[]
    )
    and (
      (new.visibility = 'public' and old.visibility <> 'public')
      or (new.review_status = 'approved' and old.review_status <> 'approved')
    )
  then
    raise exception 'Only a reviewer can approve a public deck';
  end if;
  return new;
end;
$$;

create function private.guard_pending_deck_import()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'pending'
    and not private.has_any_role(
      array['reviewer', 'admin', 'superadmin']::public.app_role[]
    )
  then
    raise exception 'A pending import is immutable until review';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_deck_review_gate() from public, anon, authenticated;
revoke all on function private.guard_pending_deck_import() from public, anon, authenticated;

create trigger decks_guard_review_gate
before update on public.decks
for each row execute function private.guard_deck_review_gate();

create trigger deck_imports_guard_pending
before update on public.deck_imports
for each row execute function private.guard_pending_deck_import();

alter table public.decks enable row level security;
alter table public.deck_imports enable row level security;
alter table public.deck_vocabulary enable row level security;

grant select, insert, update on public.decks to authenticated;
grant select on public.decks to anon;
grant select, insert, update on public.deck_imports to authenticated;
grant select on public.deck_vocabulary to anon, authenticated;
grant insert, update on public.deck_vocabulary to authenticated;
grant insert (
  id,
  content_type,
  level,
  identity_key,
  word,
  reading,
  content_origin,
  deck_id,
  external_id,
  base_locale,
  is_active,
  archived_at
) on public.content_items to authenticated;
grant update (
  level,
  word,
  reading,
  is_active,
  archived_at
) on public.content_items to authenticated;
grant update (deck_id, study_direction) on public.learning_sessions to authenticated;
grant update (card_direction) on public.learning_session_items to authenticated;

create policy decks_anon_select
on public.decks for select to anon
using (
  visibility = 'public'
  and review_status = 'approved'
  and archived_at is null
);

create policy decks_authenticated_select
on public.decks for select to authenticated
using (
  owner_id = (select auth.uid())
  or (
    visibility = 'public'
    and review_status = 'approved'
    and archived_at is null
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy decks_owner_insert
on public.decks for insert to authenticated
with check (
  kind = 'user'
  and owner_id = (select auth.uid())
  and visibility = 'private'
  and review_status = 'draft'
);

create policy decks_owner_update
on public.decks for update to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
);

create policy decks_reviewer_update
on public.decks for update to authenticated
using (
  private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
)
with check (
  private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy deck_imports_authenticated_select
on public.deck_imports for select to authenticated
using (
  imported_by = (select auth.uid())
  or exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy deck_imports_owner_insert
on public.deck_imports for insert to authenticated
with check (
  imported_by = (select auth.uid())
  and exists (
    select 1 from public.decks
    where decks.id = deck_id
      and decks.owner_id = (select auth.uid())
      and decks.archived_at is null
  )
);

create policy deck_imports_owner_or_reviewer_update
on public.deck_imports for update to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
)
with check (
  exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy deck_vocabulary_anon_select
on public.deck_vocabulary for select to anon
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_id
      and decks.visibility = 'public'
      and decks.review_status = 'approved'
      and decks.archived_at is null
  )
);

create policy deck_vocabulary_authenticated_select
on public.deck_vocabulary for select to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_id
      and (
        decks.owner_id = (select auth.uid())
        or (
          decks.visibility = 'public'
          and decks.review_status = 'approved'
          and decks.archived_at is null
        )
      )
  )
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy deck_vocabulary_owner_insert
on public.deck_vocabulary for insert to authenticated
with check (
  exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy deck_vocabulary_owner_update
on public.deck_vocabulary for update to authenticated
using (
  exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
)
with check (
  exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

drop policy content_items_anon_select on public.content_items;
drop policy content_items_authenticated_select on public.content_items;

create policy content_items_anon_select
on public.content_items for select to anon
using (
  is_active
  and content_origin <> 'openjlpt'
  and (
    content_origin <> 'deck'
    or exists (
      select 1 from public.decks
      where decks.id = deck_id
        and decks.visibility = 'public'
        and decks.review_status = 'approved'
        and decks.archived_at is null
    )
  )
);

create policy content_items_authenticated_select
on public.content_items for select to authenticated
using (
  (
    is_active
    and content_origin <> 'openjlpt'
    and (
      content_origin <> 'deck'
      or exists (
        select 1 from public.decks
        where decks.id = deck_id
          and (
            decks.owner_id = (select auth.uid())
            or (
              decks.visibility = 'public'
              and decks.review_status = 'approved'
              and decks.archived_at is null
            )
          )
      )
    )
  )
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
  or private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
);

create policy content_items_deck_owner_insert
on public.content_items for insert to authenticated
with check (
  content_origin = 'deck'
  and exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
  or (
    content_origin = 'deck'
    and private.has_any_role(
      array['reviewer', 'admin', 'superadmin']::public.app_role[]
    )
  )
);

create policy content_items_deck_owner_update
on public.content_items for update to authenticated
using (
  content_origin = 'deck'
  and exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
)
with check (
  content_origin = 'deck'
  and exists (
    select 1 from public.decks
    where decks.id = deck_id and decks.owner_id = (select auth.uid())
  )
);

create policy editorial_content_details_deck_owner_insert
on public.editorial_content_details for insert to authenticated
with check (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and (
        decks.owner_id = (select auth.uid())
        or private.has_any_role(
          array['reviewer', 'admin', 'superadmin']::public.app_role[]
        )
      )
  )
);

create policy editorial_content_details_deck_owner_update
on public.editorial_content_details for update to authenticated
using (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and (
        decks.owner_id = (select auth.uid())
        or private.has_any_role(
          array['reviewer', 'admin', 'superadmin']::public.app_role[]
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and (
        decks.owner_id = (select auth.uid())
        or private.has_any_role(
          array['reviewer', 'admin', 'superadmin']::public.app_role[]
        )
      )
  )
);

create policy vocabulary_taxonomy_deck_owner_insert
on public.vocabulary_taxonomy for insert to authenticated
with check (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
);

create policy vocabulary_taxonomy_deck_owner_update
on public.vocabulary_taxonomy for update to authenticated
using (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
);

create function public.apply_deck_import(p_import_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_import public.deck_imports%rowtype;
  selected_deck public.decks%rowtype;
  payload_item jsonb;
  selected_content_id uuid;
  archived_count integer := 0;
begin
  select * into selected_import
  from public.deck_imports
  where id = p_import_id
  for update;

  if not found then raise exception 'Deck import not found'; end if;

  select * into selected_deck
  from public.decks
  where id = selected_import.deck_id
  for update;

  if selected_import.status not in ('preview', 'pending') then
    raise exception 'Deck import cannot be applied from status %', selected_import.status;
  end if;

  if selected_deck.owner_id is distinct from (select auth.uid())
    and not private.has_any_role(
      array['reviewer', 'admin', 'superadmin']::public.app_role[]
    )
  then
    raise exception 'Deck import access denied';
  end if;

  if selected_import.status = 'pending'
    and not private.has_any_role(
      array['reviewer', 'admin', 'superadmin']::public.app_role[]
    )
  then
    raise exception 'Pending public imports require review';
  end if;

  for payload_item in
    select value from jsonb_array_elements(selected_import.normalized_payload)
  loop
    insert into public.content_items (
      content_type,
      level,
      identity_key,
      word,
      reading,
      content_origin,
      deck_id,
      external_id,
      base_locale,
      is_active,
      archived_at
    )
    values (
      'vocabulary',
      (payload_item ->> 'level')::public.jlpt_level,
      'deck:' || selected_deck.id::text || ':' || (payload_item ->> 'externalId'),
      payload_item ->> 'jp',
      payload_item ->> 'reading',
      'deck',
      selected_deck.id,
      payload_item ->> 'externalId',
      'id',
      true,
      null
    )
    on conflict (deck_id, external_id)
    do update set
      level = excluded.level,
      word = excluded.word,
      reading = excluded.reading,
      is_active = true,
      archived_at = null
    returning id into selected_content_id;

    insert into public.deck_vocabulary (
      content_item_id,
      deck_id,
      import_id,
      external_id,
      display,
      meanings_id,
      meanings_en,
      meanings_ko,
      examples,
      usage_frame,
      pair_external_id,
      tags
    )
    values (
      selected_content_id,
      selected_deck.id,
      selected_import.id,
      payload_item ->> 'externalId',
      nullif(payload_item ->> 'display', ''),
      array[payload_item ->> 'meaningId'],
      case when coalesce(payload_item ->> 'meaningEn', '') = '' then '{}'
        else array[payload_item ->> 'meaningEn'] end,
      case when coalesce(payload_item ->> 'meaningKo', '') = '' then '{}'
        else array[payload_item ->> 'meaningKo'] end,
      case when coalesce(payload_item ->> 'exampleJp', '') = '' then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object(
          'ja', payload_item ->> 'exampleJp',
          'id', payload_item ->> 'exampleId',
          'en', coalesce(payload_item ->> 'exampleEn', ''),
          'ko', coalesce(payload_item ->> 'exampleKo', '')
        )) end,
      nullif(payload_item ->> 'usageFrame', ''),
      nullif(payload_item ->> 'pairExternalId', ''),
      coalesce(
        array(select jsonb_array_elements_text(payload_item -> 'tags')),
        '{}'
      )
    )
    on conflict (content_item_id)
    do update set
      import_id = excluded.import_id,
      external_id = excluded.external_id,
      display = excluded.display,
      meanings_id = excluded.meanings_id,
      meanings_en = excluded.meanings_en,
      meanings_ko = excluded.meanings_ko,
      examples = excluded.examples,
      usage_frame = excluded.usage_frame,
      pair_external_id = excluded.pair_external_id,
      tags = excluded.tags;

    insert into public.editorial_content_details (
      content_item_id,
      title,
      reading,
      meanings,
      examples,
      formation,
      tags,
      editor_id
    )
    values (
      selected_content_id,
      coalesce(nullif(payload_item ->> 'display', ''), payload_item ->> 'jp'),
      payload_item ->> 'reading',
      array[payload_item ->> 'meaningId'],
      case when coalesce(payload_item ->> 'exampleJp', '') = '' then '[]'::jsonb
        else jsonb_build_array(jsonb_build_object(
          'ja', payload_item ->> 'exampleJp',
          'en', payload_item ->> 'exampleId'
        )) end,
      coalesce(payload_item ->> 'usageFrame', ''),
      coalesce(
        array(select jsonb_array_elements_text(payload_item -> 'tags')),
        '{}'
      ),
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
      editor_id = excluded.editor_id;

    insert into public.vocabulary_taxonomy (
      content_item_id,
      parts_of_speech,
      verb_groups,
      transitivities,
      adjective_types,
      themes,
      classification_source,
      confidence,
      needs_review
    )
    values (
      selected_content_id,
      array(
        select value::public.vocabulary_part_of_speech
        from jsonb_array_elements_text(payload_item -> 'partsOfSpeech')
      ),
      case when coalesce(payload_item ->> 'verbGroup', '') = '' then '{}'
        else array[(payload_item ->> 'verbGroup')::public.vocabulary_verb_group] end,
      case when coalesce(payload_item ->> 'transitivity', '') = '' then '{}'
        else array[(payload_item ->> 'transitivity')::public.vocabulary_transitivity] end,
      case when coalesce(payload_item ->> 'adjectiveType', '') = '' then '{}'
        else array[(payload_item ->> 'adjectiveType')::public.vocabulary_adjective_type] end,
      array(
        select value::public.vocabulary_theme
        from jsonb_array_elements_text(payload_item -> 'themes')
      ),
      'deck_import',
      1,
      false
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
      needs_review = excluded.needs_review;
  end loop;

  update public.content_items
  set is_active = false, archived_at = now()
  where deck_id = selected_deck.id
    and content_origin = 'deck'
    and is_active
    and not exists (
      select 1
      from jsonb_array_elements(selected_import.normalized_payload) as incoming(value)
      where incoming.value ->> 'externalId' = content_items.external_id
    );
  get diagnostics archived_count = row_count;

  update public.deck_imports
  set status = 'applied', applied_at = now()
  where id = selected_import.id;

  update public.decks
  set
    active_import_id = selected_import.id,
    visibility = case when selected_import.status = 'pending' then 'public'
      else visibility end,
    review_status = case when selected_import.status = 'pending' then 'approved'
      else review_status end,
    reviewed_at = case when selected_import.status = 'pending' then now()
      else reviewed_at end,
    reviewed_by = case when selected_import.status = 'pending' then (select auth.uid())
      else reviewed_by end
  where id = selected_deck.id;

  return jsonb_build_object('archived', archived_count);
end;
$$;

create function public.submit_deck_for_review(
  p_deck_id uuid,
  p_import_id uuid,
  p_attestation text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if btrim(coalesce(p_attestation, '')) = '' then
    raise exception 'Content rights attestation is required';
  end if;

  update public.decks
  set
    review_status = 'pending',
    visibility = 'private',
    rights_attested_at = now(),
    rights_attestation = btrim(p_attestation),
    submitted_at = now()
  where id = p_deck_id
    and owner_id = (select auth.uid())
    and archived_at is null;
  if not found then raise exception 'Deck not found'; end if;

  update public.deck_imports
  set status = 'pending'
  where id = p_import_id
    and deck_id = p_deck_id
    and status in ('preview', 'applied');
  if not found then raise exception 'Import not ready for review'; end if;

  return true;
end;
$$;

create function public.reject_deck_import(p_import_id uuid, p_notes text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_deck_id uuid;
begin
  if not private.has_any_role(
    array['reviewer', 'admin', 'superadmin']::public.app_role[]
  ) then
    raise exception 'Reviewer access required';
  end if;

  update public.deck_imports
  set status = 'rejected', rejected_at = now()
  where id = p_import_id and status = 'pending'
  returning deck_id into selected_deck_id;
  if not found then raise exception 'Pending import not found'; end if;

  update public.decks
  set
    review_status = 'rejected',
    visibility = 'private',
    reviewed_at = now(),
    reviewed_by = (select auth.uid()),
    review_notes = nullif(btrim(coalesce(p_notes, '')), '')
  where id = selected_deck_id;

  return true;
end;
$$;

create function public.get_deck_learning_candidates(
  p_deck_id uuid,
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

revoke all on function public.apply_deck_import(uuid) from public, anon;
revoke all on function public.submit_deck_for_review(uuid, uuid, text) from public, anon;
revoke all on function public.reject_deck_import(uuid, text) from public, anon;
revoke all on function public.get_deck_learning_candidates(
  uuid,
  public.vocabulary_adjective_type[],
  integer
) from public, anon;
grant execute on function public.apply_deck_import(uuid) to authenticated;
grant execute on function public.submit_deck_for_review(uuid, uuid, text) to authenticated;
grant execute on function public.reject_deck_import(uuid, text) to authenticated;
grant execute on function public.get_deck_learning_candidates(
  uuid,
  public.vocabulary_adjective_type[],
  integer
) to authenticated;

-- Archive the legacy source without deleting content or user history.
update public.content_items
set is_active = false
where content_origin = 'openjlpt' and is_active;

update public.source_snapshots
set status = 'archived'
where status = 'active';

commit;
