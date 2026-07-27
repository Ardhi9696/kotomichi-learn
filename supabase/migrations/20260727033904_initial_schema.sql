-- Remote migration version: 20260727033904
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.jlpt_level as enum ('N5', 'N4', 'N3', 'N2', 'N1');
create type public.content_type as enum ('vocabulary', 'kanji', 'grammar');
create type public.snapshot_status as enum ('importing', 'validated', 'active', 'archived', 'failed');
create type public.translation_locale as enum ('id', 'ko');
create type public.translation_status as enum ('draft', 'reviewed', 'published', 'needs_review');
create type public.app_role as enum ('editor', 'reviewer', 'admin');
create type public.learning_status as enum ('new', 'learning', 'review', 'mastered');
create type public.review_rating as enum ('forgot', 'hard', 'good', 'easy');
create type public.report_status as enum ('open', 'triaged', 'resolved', 'rejected');

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_name text not null default 'OpenJLPT',
  source_version text not null,
  source_commit text,
  source_url text not null default 'https://github.com/evanclan/OpenJLPT',
  dataset_checksum text not null,
  license text not null default 'CC BY-SA 4.0',
  status public.snapshot_status not null default 'importing',
  item_counts jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  validated_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint source_snapshots_checksum_format check (dataset_checksum ~ '^[a-f0-9]{64}$'),
  constraint source_snapshots_item_counts_object check (jsonb_typeof(item_counts) = 'object'),
  constraint source_snapshots_source_version_unique unique (source_version, dataset_checksum)
);

create unique index source_snapshots_one_active_idx
  on public.source_snapshots ((status))
  where status = 'active';

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type public.content_type not null,
  level public.jlpt_level not null,
  identity_key text not null unique,
  word text,
  reading text,
  character text,
  pattern text,
  current_snapshot_id uuid references public.source_snapshots(id) on delete restrict,
  current_source_fingerprint text,
  first_seen_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  last_seen_snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_identity_key_not_blank check (btrim(identity_key) <> ''),
  constraint content_items_fingerprint_format check (
    current_source_fingerprint is null
    or current_source_fingerprint ~ '^[a-f0-9]{64}$'
  ),
  constraint content_items_structured_identity check (
    (
      content_type = 'vocabulary'
      and word is not null
      and reading is not null
      and character is null
      and pattern is null
    )
    or (
      content_type = 'kanji'
      and word is null
      and reading is null
      and character is not null
      and pattern is null
    )
    or (
      content_type = 'grammar'
      and word is null
      and reading is null
      and character is null
      and pattern is not null
    )
  )
);

create unique index content_items_vocab_identity_idx
  on public.content_items (level, word, reading)
  where content_type = 'vocabulary';

create unique index content_items_kanji_identity_idx
  on public.content_items (level, character)
  where content_type = 'kanji';

create unique index content_items_grammar_identity_idx
  on public.content_items (level, pattern)
  where content_type = 'grammar';

create index content_items_catalog_idx
  on public.content_items (level, content_type, is_active);

create table public.vocab (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  word text not null,
  reading text not null default '',
  meanings text[] not null,
  examples jsonb not null default '[]'::jsonb,
  source_fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint vocab_word_not_blank check (btrim(word) <> ''),
  constraint vocab_meanings_not_empty check (cardinality(meanings) > 0),
  constraint vocab_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint vocab_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint vocab_snapshot_item_unique unique (snapshot_id, content_item_id),
  constraint vocab_snapshot_identity_unique unique (snapshot_id, word, reading)
);

create table public.kanji (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  character text not null,
  onyomi text[] not null default '{}',
  kunyomi text[] not null default '{}',
  meanings text[] not null default '{}',
  strokes integer,
  grade integer,
  frequency integer,
  source_fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint kanji_character_not_blank check (btrim(character) <> ''),
  constraint kanji_strokes_positive check (strokes is null or strokes > 0),
  constraint kanji_grade_positive check (grade is null or grade > 0),
  constraint kanji_frequency_positive check (frequency is null or frequency > 0),
  constraint kanji_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint kanji_snapshot_item_unique unique (snapshot_id, content_item_id),
  constraint kanji_snapshot_identity_unique unique (snapshot_id, character)
);

create table public.grammar (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  snapshot_id uuid not null references public.source_snapshots(id) on delete restrict,
  pattern text not null,
  meaning text not null,
  formation text not null default '',
  examples jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  notes text not null default '',
  source_fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint grammar_pattern_not_blank check (btrim(pattern) <> ''),
  constraint grammar_meaning_not_blank check (btrim(meaning) <> ''),
  constraint grammar_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint grammar_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint grammar_snapshot_item_unique unique (snapshot_id, content_item_id),
  constraint grammar_snapshot_identity_unique unique (snapshot_id, pattern)
);

create index vocab_content_item_idx on public.vocab (content_item_id);
create index vocab_snapshot_idx on public.vocab (snapshot_id);
create index vocab_meanings_idx on public.vocab using gin (meanings);
create index kanji_content_item_idx on public.kanji (content_item_id);
create index kanji_snapshot_idx on public.kanji (snapshot_id);
create index kanji_meanings_idx on public.kanji using gin (meanings);
create index grammar_content_item_idx on public.grammar (content_item_id);
create index grammar_snapshot_idx on public.grammar (snapshot_id);
create index grammar_tags_idx on public.grammar using gin (tags);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  content_locale text not null default 'en',
  interface_locale text not null default 'id',
  target_level public.jlpt_level not null default 'N5',
  daily_goal integer not null default 10,
  theme text not null default 'light',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_content_locale check (content_locale in ('en', 'id', 'ko')),
  constraint profiles_interface_locale check (interface_locale in ('en', 'id', 'ko')),
  constraint profiles_daily_goal_range check (daily_goal between 1 and 200),
  constraint profiles_theme check (theme in ('light', 'dark', 'system'))
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.vocab_translations (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale public.translation_locale not null,
  meanings text[] not null,
  examples jsonb not null default '[]'::jsonb,
  status public.translation_status not null default 'draft',
  source_fingerprint text not null,
  editor_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocab_translations_meanings_not_empty check (cardinality(meanings) > 0),
  constraint vocab_translations_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint vocab_translations_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint vocab_translations_content_locale_unique unique (content_item_id, locale)
);

create table public.kanji_translations (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale public.translation_locale not null,
  meanings text[] not null,
  status public.translation_status not null default 'draft',
  source_fingerprint text not null,
  editor_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kanji_translations_meanings_not_empty check (cardinality(meanings) > 0),
  constraint kanji_translations_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint kanji_translations_content_locale_unique unique (content_item_id, locale)
);

create table public.grammar_translations (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale public.translation_locale not null,
  meaning text not null,
  formation text not null default '',
  examples jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  notes text not null default '',
  status public.translation_status not null default 'draft',
  source_fingerprint text not null,
  editor_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid references auth.users(id) on delete set null,
  review_notes text,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_translations_meaning_not_blank check (btrim(meaning) <> ''),
  constraint grammar_translations_examples_array check (jsonb_typeof(examples) = 'array'),
  constraint grammar_translations_fingerprint_format check (source_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint grammar_translations_content_locale_unique unique (content_item_id, locale)
);

create index vocab_translations_lookup_idx
  on public.vocab_translations (locale, status, content_item_id);
create index kanji_translations_lookup_idx
  on public.kanji_translations (locale, status, content_item_id);
create index grammar_translations_lookup_idx
  on public.grammar_translations (locale, status, content_item_id);

create table public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  status public.learning_status not null default 'new',
  attempts_count integer not null default 0,
  correct_count integer not null default 0,
  review_count integer not null default 0,
  interval_days integer not null default 0,
  ease_factor numeric(4, 2) not null default 2.50,
  last_rating public.review_rating,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_progress_counts_nonnegative check (
    attempts_count >= 0
    and correct_count >= 0
    and review_count >= 0
    and interval_days >= 0
  ),
  constraint learning_progress_correct_not_above_attempts check (correct_count <= attempts_count),
  constraint learning_progress_ease_factor_range check (ease_factor between 1.30 and 5.00),
  constraint learning_progress_user_content_unique unique (user_id, content_item_id)
);

create index learning_progress_due_idx
  on public.learning_progress (user_id, next_review_at)
  where status in ('learning', 'review');

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level public.jlpt_level not null,
  content_types public.content_type[] not null,
  target_item_count integer not null,
  completed_item_count integer not null default 0,
  correct_item_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint learning_sessions_content_types_not_empty check (cardinality(content_types) > 0),
  constraint learning_sessions_target_positive check (target_item_count > 0),
  constraint learning_sessions_counts_valid check (
    completed_item_count >= 0
    and correct_item_count >= 0
    and correct_item_count <= completed_item_count
    and completed_item_count <= target_item_count
  ),
  constraint learning_sessions_id_user_unique unique (id, user_id)
);

create index learning_sessions_user_started_idx
  on public.learning_sessions (user_id, started_at desc);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  client_attempt_id uuid not null,
  session_id uuid not null,
  user_id uuid not null,
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  question_type text not null,
  is_correct boolean not null,
  rating public.review_rating,
  response_time_ms integer,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_session_user_fk
    foreign key (session_id, user_id)
    references public.learning_sessions(id, user_id)
    on delete cascade,
  constraint quiz_attempts_question_type check (
    question_type in ('flashcard', 'meaning_choice', 'reading_choice', 'recall', 'sentence_completion')
  ),
  constraint quiz_attempts_response_time_nonnegative check (
    response_time_ms is null or response_time_ms >= 0
  ),
  constraint quiz_attempts_client_idempotency unique (user_id, client_attempt_id)
);

create index quiz_attempts_session_idx on public.quiz_attempts (session_id, answered_at);
create index quiz_attempts_user_content_idx
  on public.quiz_attempts (user_id, content_item_id, answered_at desc);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  locale text not null,
  field_name text not null,
  message text not null,
  status public.report_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_locale check (locale in ('en', 'id', 'ko')),
  constraint content_reports_field_not_blank check (btrim(field_name) <> ''),
  constraint content_reports_message_not_blank check (btrim(message) <> '')
);

create index content_reports_status_created_idx
  on public.content_reports (status, created_at);
create index content_reports_reporter_idx
  on public.content_reports (reporter_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.has_any_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = any(required_roles)
  );
$$;

revoke all on function private.has_any_role(public.app_role[]) from public;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

create function private.mark_translations_for_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.current_source_fingerprint is distinct from new.current_source_fingerprint
    and old.current_source_fingerprint is not null
  then
    if new.content_type = 'vocabulary' then
      update public.vocab_translations
      set status = 'needs_review', updated_at = now()
      where content_item_id = new.id
        and source_fingerprint is distinct from new.current_source_fingerprint;
    elsif new.content_type = 'kanji' then
      update public.kanji_translations
      set status = 'needs_review', updated_at = now()
      where content_item_id = new.id
        and source_fingerprint is distinct from new.current_source_fingerprint;
    elsif new.content_type = 'grammar' then
      update public.grammar_translations
      set status = 'needs_review', updated_at = now()
      where content_item_id = new.id
        and source_fingerprint is distinct from new.current_source_fingerprint;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.mark_translations_for_review() from public;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

create trigger vocab_translations_set_updated_at
before update on public.vocab_translations
for each row execute function public.set_updated_at();

create trigger kanji_translations_set_updated_at
before update on public.kanji_translations
for each row execute function public.set_updated_at();

create trigger grammar_translations_set_updated_at
before update on public.grammar_translations
for each row execute function public.set_updated_at();

create trigger learning_progress_set_updated_at
before update on public.learning_progress
for each row execute function public.set_updated_at();

create trigger content_reports_set_updated_at
before update on public.content_reports
for each row execute function public.set_updated_at();

create trigger content_items_mark_translations_for_review
after update of current_source_fingerprint on public.content_items
for each row execute function private.mark_translations_for_review();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.source_snapshots enable row level security;
alter table public.content_items enable row level security;
alter table public.vocab enable row level security;
alter table public.kanji enable row level security;
alter table public.grammar enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.vocab_translations enable row level security;
alter table public.kanji_translations enable row level security;
alter table public.grammar_translations enable row level security;
alter table public.learning_progress enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.content_reports enable row level security;

grant select on public.source_snapshots to anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant select on public.vocab to anon, authenticated;
grant select on public.kanji to anon, authenticated;
grant select on public.grammar to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.vocab_translations to authenticated;
grant select, insert, update, delete on public.kanji_translations to authenticated;
grant select, insert, update, delete on public.grammar_translations to authenticated;
grant select, insert, update, delete on public.learning_progress to authenticated;
grant select, insert, update, delete on public.learning_sessions to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant select, insert, update on public.content_reports to authenticated;

create policy source_snapshots_public_active_select
on public.source_snapshots
for select
to anon, authenticated
using (status = 'active');

create policy source_snapshots_editorial_select
on public.source_snapshots
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy content_items_public_active_select
on public.content_items
for select
to anon, authenticated
using (is_active);

create policy content_items_editorial_select
on public.content_items
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy vocab_public_active_select
on public.vocab
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = vocab.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = vocab.snapshot_id
  )
);

create policy vocab_editorial_select
on public.vocab
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy kanji_public_active_select
on public.kanji
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = kanji.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = kanji.snapshot_id
  )
);

create policy kanji_editorial_select
on public.kanji
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy grammar_public_active_select
on public.grammar
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = grammar.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = grammar.snapshot_id
  )
);

create policy grammar_editorial_select
on public.grammar
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy profiles_own_select
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_own_update
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy user_roles_own_select
on public.user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy user_roles_admin_select
on public.user_roles
for select
to authenticated
using (private.has_any_role(array['admin']::public.app_role[]));

create policy vocab_translations_public_select
on public.vocab_translations
for select
to anon, authenticated
using (status = 'published');

create policy vocab_translations_editorial_select
on public.vocab_translations
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy kanji_translations_public_select
on public.kanji_translations
for select
to anon, authenticated
using (status = 'published');

create policy kanji_translations_editorial_select
on public.kanji_translations
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy grammar_translations_public_select
on public.grammar_translations
for select
to anon, authenticated
using (status = 'published');

create policy grammar_translations_editorial_select
on public.grammar_translations
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy vocab_translations_editor_insert
on public.vocab_translations
for insert
to authenticated
with check (
  private.has_any_role(array['editor']::public.app_role[])
  and status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy kanji_translations_editor_insert
on public.kanji_translations
for insert
to authenticated
with check (
  private.has_any_role(array['editor']::public.app_role[])
  and status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy grammar_translations_editor_insert
on public.grammar_translations
for insert
to authenticated
with check (
  private.has_any_role(array['editor']::public.app_role[])
  and status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy vocab_translations_editor_update
on public.vocab_translations
for update
to authenticated
using (private.has_any_role(array['editor']::public.app_role[]))
with check (
  status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy kanji_translations_editor_update
on public.kanji_translations
for update
to authenticated
using (private.has_any_role(array['editor']::public.app_role[]))
with check (
  status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy grammar_translations_editor_update
on public.grammar_translations
for update
to authenticated
using (private.has_any_role(array['editor']::public.app_role[]))
with check (
  status in ('draft', 'needs_review')
  and editor_id = (select auth.uid())
);

create policy vocab_translations_reviewer_manage
on public.vocab_translations
for all
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]))
with check (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

create policy kanji_translations_reviewer_manage
on public.kanji_translations
for all
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]))
with check (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

create policy grammar_translations_reviewer_manage
on public.grammar_translations
for all
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]))
with check (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

create policy learning_progress_own_select
on public.learning_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_progress_own_insert
on public.learning_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learning_progress_own_update
on public.learning_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learning_progress_own_delete
on public.learning_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_sessions_own_select
on public.learning_sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_sessions_own_insert
on public.learning_sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learning_sessions_own_update
on public.learning_sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learning_sessions_own_delete
on public.learning_sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy quiz_attempts_own_select
on public.quiz_attempts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy quiz_attempts_own_insert
on public.quiz_attempts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy quiz_attempts_own_update
on public.quiz_attempts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy quiz_attempts_own_delete
on public.quiz_attempts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy content_reports_own_select
on public.content_reports
for select
to authenticated
using ((select auth.uid()) = reporter_id);

create policy content_reports_own_insert
on public.content_reports
for insert
to authenticated
with check (
  (select auth.uid()) = reporter_id
  and status = 'open'
  and resolved_by is null
  and resolved_at is null
);

create policy content_reports_editorial_select
on public.content_reports
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create policy content_reports_editorial_update
on public.content_reports
for update
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]))
with check (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

comment on table public.source_snapshots is
  'Validated OpenJLPT imports. OpenJLPT remains the canonical source under CC BY-SA 4.0.';
comment on table public.vocab is
  'Versioned vocabulary serving copy imported from OpenJLPT; canonical fields are not edited in the app.';
comment on table public.kanji is
  'Versioned kanji serving copy imported from OpenJLPT; canonical fields are not edited in the app.';
comment on table public.grammar is
  'Versioned grammar serving copy imported from OpenJLPT; canonical fields are not edited in the app.';
comment on table public.vocab_translations is
  'Indonesian and Korean translation overlays; adapted material is distributed under CC BY-SA 4.0.';
comment on table public.kanji_translations is
  'Indonesian and Korean translation overlays; adapted material is distributed under CC BY-SA 4.0.';
comment on table public.grammar_translations is
  'Indonesian and Korean translation overlays; adapted material is distributed under CC BY-SA 4.0.';

commit;
