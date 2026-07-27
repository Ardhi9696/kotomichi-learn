alter table public.vocab_translations
  add column submitted_at timestamptz;
alter table public.kanji_translations
  add column submitted_at timestamptz;
alter table public.grammar_translations
  add column submitted_at timestamptz;

create table public.translation_revisions (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid not null,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  content_type public.content_type not null,
  locale public.translation_locale not null,
  status public.translation_status not null,
  operation text not null,
  payload jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint translation_revisions_operation_allowed check (
    operation in ('INSERT', 'UPDATE')
  ),
  constraint translation_revisions_payload_object check (
    jsonb_typeof(payload) = 'object'
  )
);

create index translation_revisions_lookup_idx
  on public.translation_revisions (
    content_item_id,
    content_type,
    locale,
    created_at desc
  );

alter table public.translation_revisions enable row level security;
grant select on public.translation_revisions to authenticated;

create policy translation_revisions_editorial_select
on public.translation_revisions
for select
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]));

create function private.log_translation_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_type public.content_type;
begin
  selected_type := case tg_table_name
    when 'vocab_translations' then 'vocabulary'::public.content_type
    when 'kanji_translations' then 'kanji'::public.content_type
    else 'grammar'::public.content_type
  end;

  insert into public.translation_revisions (
    translation_id,
    content_item_id,
    content_type,
    locale,
    status,
    operation,
    payload,
    changed_by
  )
  values (
    new.id,
    new.content_item_id,
    selected_type,
    new.locale,
    new.status,
    tg_op,
    to_jsonb(new),
    (select auth.uid())
  );

  return new;
end;
$$;

revoke all on function private.log_translation_revision() from public;

create trigger vocab_translations_log_revision
after insert or update on public.vocab_translations
for each row execute function private.log_translation_revision();

create trigger kanji_translations_log_revision
after insert or update on public.kanji_translations
for each row execute function private.log_translation_revision();

create trigger grammar_translations_log_revision
after insert or update on public.grammar_translations
for each row execute function private.log_translation_revision();

drop policy vocab_translations_authenticated_update on public.vocab_translations;
create policy vocab_translations_authenticated_update
on public.vocab_translations
for update
to authenticated
using (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
)
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);

drop policy kanji_translations_authenticated_update on public.kanji_translations;
create policy kanji_translations_authenticated_update
on public.kanji_translations
for update
to authenticated
using (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
)
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);

drop policy grammar_translations_authenticated_update on public.grammar_translations;
create policy grammar_translations_authenticated_update
on public.grammar_translations
for update
to authenticated
using (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
)
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
