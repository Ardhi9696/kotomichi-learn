begin;

create function public.sync_learning_session_summary()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  completed_count integer;
  correct_count integer;
begin
  select count(*)::integer
  into completed_count
  from public.learning_session_items
  where session_id = new.session_id
    and user_id = new.user_id
    and completed_at is not null;

  select count(*)::integer
  into correct_count
  from public.quiz_attempts as attempt
  inner join public.learning_session_items as item
    on item.session_id = attempt.session_id
    and item.user_id = attempt.user_id
    and item.client_attempt_id = attempt.client_attempt_id
  where attempt.session_id = new.session_id
    and attempt.user_id = new.user_id
    and attempt.is_correct
    and item.completed_at is not null;

  update public.learning_sessions
  set
    completed_item_count = completed_count,
    correct_item_count = correct_count,
    completed_at = case
      when completed_count >= target_item_count
        then coalesce(completed_at, new.completed_at)
      else null
    end
  where id = new.session_id
    and user_id = new.user_id;

  return new;
end;
$$;

create trigger sync_learning_session_summary_after_completion
after update of completed_at on public.learning_session_items
for each row
when (old.completed_at is null and new.completed_at is not null)
execute function public.sync_learning_session_summary();

revoke all on function public.sync_learning_session_summary() from public, anon, authenticated;

commit;
