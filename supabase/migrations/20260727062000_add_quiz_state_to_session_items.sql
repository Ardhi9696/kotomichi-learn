-- Add the durable state required for the flashcard -> quiz -> feedback flow.
begin;

alter table public.learning_session_items
  add column studied_at timestamptz,
  add column client_attempt_id uuid not null default gen_random_uuid();

update public.learning_session_items
set studied_at = completed_at
where completed_at is not null;

alter table public.learning_session_items
  add constraint learning_session_items_client_attempt_unique
  unique (user_id, client_attempt_id);

commit;
