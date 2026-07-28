begin;

create index deck_imports_imported_by_idx on public.deck_imports (imported_by);
create index deck_vocabulary_import_id_idx on public.deck_vocabulary (import_id);
create index decks_active_import_idx on public.decks (active_import_id)
  where active_import_id is not null;
create index decks_reviewed_by_idx on public.decks (reviewed_by)
  where reviewed_by is not null;
create index learning_sessions_deck_id_idx on public.learning_sessions (deck_id)
  where deck_id is not null;

drop policy content_items_editorial_insert on public.content_items;
drop policy content_items_deck_owner_insert on public.content_items;
create policy content_items_authorized_insert
on public.content_items for insert to authenticated
with check (
  (
    content_origin = 'editorial'
    and private.has_any_role(
      array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
    )
  )
  or (
    content_origin = 'deck'
    and (
      exists (
        select 1 from public.decks
        where decks.id = deck_id and decks.owner_id = (select auth.uid())
      )
      or private.has_any_role(
        array['reviewer', 'admin', 'superadmin']::public.app_role[]
      )
    )
  )
);

drop policy content_items_editorial_update on public.content_items;
drop policy content_items_deck_owner_update on public.content_items;
create policy content_items_authorized_update
on public.content_items for update to authenticated
using (
  private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
  or (
    content_origin = 'deck'
    and exists (
      select 1 from public.decks
      where decks.id = deck_id and decks.owner_id = (select auth.uid())
    )
  )
)
with check (
  private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
  or (
    content_origin = 'deck'
    and exists (
      select 1 from public.decks
      where decks.id = deck_id and decks.owner_id = (select auth.uid())
    )
  )
);

drop policy decks_owner_update on public.decks;
create policy decks_owner_update
on public.decks for update to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and visibility = 'private'
  and review_status in ('draft', 'pending', 'rejected')
);

drop policy editorial_content_details_editor_insert
  on public.editorial_content_details;
drop policy editorial_content_details_deck_owner_insert
  on public.editorial_content_details;
create policy editorial_content_details_authorized_insert
on public.editorial_content_details for insert to authenticated
with check (
  editor_id = (select auth.uid())
  and (
    private.has_any_role(
      array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
    )
    or exists (
      select 1
      from public.content_items
      join public.decks on decks.id = content_items.deck_id
      where content_items.id = content_item_id
        and content_items.content_origin = 'deck'
        and decks.owner_id = (select auth.uid())
    )
  )
);

drop policy editorial_content_details_editor_update
  on public.editorial_content_details;
drop policy editorial_content_details_deck_owner_update
  on public.editorial_content_details;
create policy editorial_content_details_authorized_update
on public.editorial_content_details for update to authenticated
using (
  private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
  or exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
)
with check (
  editor_id = (select auth.uid())
  and (
    private.has_any_role(
      array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
    )
    or exists (
      select 1
      from public.content_items
      join public.decks on decks.id = content_items.deck_id
      where content_items.id = content_item_id
        and content_items.content_origin = 'deck'
        and decks.owner_id = (select auth.uid())
    )
  )
);

drop policy vocabulary_taxonomy_editor_insert on public.vocabulary_taxonomy;
drop policy vocabulary_taxonomy_deck_owner_insert on public.vocabulary_taxonomy;
create policy vocabulary_taxonomy_authorized_insert
on public.vocabulary_taxonomy for insert to authenticated
with check (
  exists (
    select 1 from public.content_items
    where content_items.id = content_item_id
      and content_items.content_type = 'vocabulary'
  )
  and (
    private.has_any_role(
      array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
    )
    or exists (
      select 1
      from public.content_items
      join public.decks on decks.id = content_items.deck_id
      where content_items.id = content_item_id
        and content_items.content_origin = 'deck'
        and decks.owner_id = (select auth.uid())
    )
  )
);

drop policy vocabulary_taxonomy_editor_update on public.vocabulary_taxonomy;
drop policy vocabulary_taxonomy_deck_owner_update on public.vocabulary_taxonomy;
create policy vocabulary_taxonomy_authorized_update
on public.vocabulary_taxonomy for update to authenticated
using (
  private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
  or exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
)
with check (
  private.has_any_role(
    array['editor', 'reviewer', 'admin', 'superadmin']::public.app_role[]
  )
  or exists (
    select 1
    from public.content_items
    join public.decks on decks.id = content_items.deck_id
    where content_items.id = content_item_id
      and content_items.content_origin = 'deck'
      and decks.owner_id = (select auth.uid())
  )
);

commit;
