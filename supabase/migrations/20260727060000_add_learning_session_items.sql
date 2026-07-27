-- Persist the ordered content selected for each learning session so a session can be
-- resumed without selecting a different set of material.
begin;

create table public.learning_session_items (
  session_id uuid not null,
  user_id uuid not null,
  content_item_id uuid not null references public.content_items(id) on delete restrict,
  position integer not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (session_id, position),
  constraint learning_session_items_session_user_fk
    foreign key (session_id, user_id)
    references public.learning_sessions(id, user_id)
    on delete cascade,
  constraint learning_session_items_position_nonnegative check (position >= 0),
  constraint learning_session_items_content_unique unique (session_id, content_item_id)
);

create index learning_session_items_user_session_idx
  on public.learning_session_items (user_id, session_id, position);

create index learning_session_items_content_item_idx
  on public.learning_session_items (content_item_id);

alter table public.learning_session_items enable row level security;

grant select, insert, update, delete on public.learning_session_items to authenticated;

create policy learning_session_items_own_select
on public.learning_session_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy learning_session_items_own_insert
on public.learning_session_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy learning_session_items_own_update
on public.learning_session_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy learning_session_items_own_delete
on public.learning_session_items
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
