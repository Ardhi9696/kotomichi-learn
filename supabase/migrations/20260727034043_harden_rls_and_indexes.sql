-- Remote migration version: 20260727034043
begin;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function private.mark_translations_for_review() from public, anon, authenticated;

create index content_items_current_snapshot_idx
  on public.content_items (current_snapshot_id);
create index content_items_first_seen_snapshot_idx
  on public.content_items (first_seen_snapshot_id);
create index content_items_last_seen_snapshot_idx
  on public.content_items (last_seen_snapshot_id);
create index content_reports_content_item_idx
  on public.content_reports (content_item_id);
create index content_reports_resolved_by_idx
  on public.content_reports (resolved_by);
create index grammar_translations_editor_idx
  on public.grammar_translations (editor_id);
create index grammar_translations_reviewer_idx
  on public.grammar_translations (reviewer_id);
create index kanji_translations_editor_idx
  on public.kanji_translations (editor_id);
create index kanji_translations_reviewer_idx
  on public.kanji_translations (reviewer_id);
create index learning_progress_content_item_idx
  on public.learning_progress (content_item_id);
create index quiz_attempts_content_item_idx
  on public.quiz_attempts (content_item_id);
create index quiz_attempts_session_user_idx
  on public.quiz_attempts (session_id, user_id);
create index user_roles_granted_by_idx
  on public.user_roles (granted_by);
create index vocab_translations_editor_idx
  on public.vocab_translations (editor_id);
create index vocab_translations_reviewer_idx
  on public.vocab_translations (reviewer_id);

drop policy source_snapshots_public_active_select on public.source_snapshots;
drop policy source_snapshots_editorial_select on public.source_snapshots;
create policy source_snapshots_anon_select
on public.source_snapshots
for select
to anon
using (status = 'active');
create policy source_snapshots_authenticated_select
on public.source_snapshots
for select
to authenticated
using (
  status = 'active'
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy content_items_public_active_select on public.content_items;
drop policy content_items_editorial_select on public.content_items;
create policy content_items_anon_select
on public.content_items
for select
to anon
using (is_active);
create policy content_items_authenticated_select
on public.content_items
for select
to authenticated
using (
  is_active
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy vocab_public_active_select on public.vocab;
drop policy vocab_editorial_select on public.vocab;
create policy vocab_anon_select
on public.vocab
for select
to anon
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = vocab.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = vocab.snapshot_id
  )
);
create policy vocab_authenticated_select
on public.vocab
for select
to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = vocab.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = vocab.snapshot_id
  )
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy kanji_public_active_select on public.kanji;
drop policy kanji_editorial_select on public.kanji;
create policy kanji_anon_select
on public.kanji
for select
to anon
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = kanji.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = kanji.snapshot_id
  )
);
create policy kanji_authenticated_select
on public.kanji
for select
to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = kanji.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = kanji.snapshot_id
  )
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy grammar_public_active_select on public.grammar;
drop policy grammar_editorial_select on public.grammar;
create policy grammar_anon_select
on public.grammar
for select
to anon
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = grammar.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = grammar.snapshot_id
  )
);
create policy grammar_authenticated_select
on public.grammar
for select
to authenticated
using (
  exists (
    select 1
    from public.content_items
    where content_items.id = grammar.content_item_id
      and content_items.is_active
      and content_items.current_snapshot_id = grammar.snapshot_id
  )
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy user_roles_own_select on public.user_roles;
drop policy user_roles_admin_select on public.user_roles;
create policy user_roles_authenticated_select
on public.user_roles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or private.has_any_role(array['admin']::public.app_role[])
);

drop policy content_reports_own_select on public.content_reports;
drop policy content_reports_editorial_select on public.content_reports;
create policy content_reports_authenticated_select
on public.content_reports
for select
to authenticated
using (
  (select auth.uid()) = reporter_id
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);

drop policy vocab_translations_public_select on public.vocab_translations;
drop policy vocab_translations_editorial_select on public.vocab_translations;
drop policy vocab_translations_editor_insert on public.vocab_translations;
drop policy vocab_translations_editor_update on public.vocab_translations;
drop policy vocab_translations_reviewer_manage on public.vocab_translations;
create policy vocab_translations_anon_select
on public.vocab_translations
for select
to anon
using (status = 'published');
create policy vocab_translations_authenticated_select
on public.vocab_translations
for select
to authenticated
using (
  status = 'published'
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);
create policy vocab_translations_authenticated_insert
on public.vocab_translations
for insert
to authenticated
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy vocab_translations_authenticated_update
on public.vocab_translations
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy vocab_translations_reviewer_delete
on public.vocab_translations
for delete
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

drop policy kanji_translations_public_select on public.kanji_translations;
drop policy kanji_translations_editorial_select on public.kanji_translations;
drop policy kanji_translations_editor_insert on public.kanji_translations;
drop policy kanji_translations_editor_update on public.kanji_translations;
drop policy kanji_translations_reviewer_manage on public.kanji_translations;
create policy kanji_translations_anon_select
on public.kanji_translations
for select
to anon
using (status = 'published');
create policy kanji_translations_authenticated_select
on public.kanji_translations
for select
to authenticated
using (
  status = 'published'
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);
create policy kanji_translations_authenticated_insert
on public.kanji_translations
for insert
to authenticated
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy kanji_translations_authenticated_update
on public.kanji_translations
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy kanji_translations_reviewer_delete
on public.kanji_translations
for delete
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

drop policy grammar_translations_public_select on public.grammar_translations;
drop policy grammar_translations_editorial_select on public.grammar_translations;
drop policy grammar_translations_editor_insert on public.grammar_translations;
drop policy grammar_translations_editor_update on public.grammar_translations;
drop policy grammar_translations_reviewer_manage on public.grammar_translations;
create policy grammar_translations_anon_select
on public.grammar_translations
for select
to anon
using (status = 'published');
create policy grammar_translations_authenticated_select
on public.grammar_translations
for select
to authenticated
using (
  status = 'published'
  or private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[])
);
create policy grammar_translations_authenticated_insert
on public.grammar_translations
for insert
to authenticated
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    private.has_any_role(array['editor']::public.app_role[])
    and status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy grammar_translations_authenticated_update
on public.grammar_translations
for update
to authenticated
using (private.has_any_role(array['editor', 'reviewer', 'admin']::public.app_role[]))
with check (
  private.has_any_role(array['reviewer', 'admin']::public.app_role[])
  or (
    status in ('draft', 'needs_review')
    and editor_id = (select auth.uid())
  )
);
create policy grammar_translations_reviewer_delete
on public.grammar_translations
for delete
to authenticated
using (private.has_any_role(array['reviewer', 'admin']::public.app_role[]));

commit;
