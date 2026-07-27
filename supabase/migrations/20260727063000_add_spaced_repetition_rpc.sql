begin;

alter table public.learning_session_items
  add column progress_applied_at timestamptz;

alter table public.learning_sessions
  add column session_mode text not null default 'learn',
  add constraint learning_sessions_mode_check check (session_mode in ('learn', 'review'));

create function public.apply_learning_review(
  p_session_id uuid,
  p_position integer,
  p_rating public.review_rating,
  p_status public.learning_status,
  p_attempts_count integer,
  p_correct_count integer,
  p_review_count integer,
  p_interval_days integer,
  p_ease_factor numeric,
  p_next_review_at timestamptz,
  p_mastered_at timestamptz
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  selected_item public.learning_session_items%rowtype;
  selected_attempt public.quiz_attempts%rowtype;
begin
  select *
  into selected_item
  from public.learning_session_items
  where session_id = p_session_id
    and position = p_position
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Learning session item not found';
  end if;

  if selected_item.progress_applied_at is not null then
    return false;
  end if;

  select *
  into selected_attempt
  from public.quiz_attempts
  where user_id = (select auth.uid())
    and client_attempt_id = selected_item.client_attempt_id;

  if not found then
    raise exception 'Quiz attempt not found';
  end if;

  insert into public.learning_progress (
    user_id,
    content_item_id,
    status,
    attempts_count,
    correct_count,
    review_count,
    interval_days,
    ease_factor,
    last_rating,
    last_reviewed_at,
    next_review_at,
    mastered_at
  )
  values (
    (select auth.uid()),
    selected_item.content_item_id,
    p_status,
    p_attempts_count,
    p_correct_count,
    p_review_count,
    p_interval_days,
    p_ease_factor,
    p_rating,
    now(),
    p_next_review_at,
    p_mastered_at
  )
  on conflict (user_id, content_item_id)
  do update set
    status = excluded.status,
    attempts_count = excluded.attempts_count,
    correct_count = excluded.correct_count,
    review_count = excluded.review_count,
    interval_days = excluded.interval_days,
    ease_factor = excluded.ease_factor,
    last_rating = excluded.last_rating,
    last_reviewed_at = excluded.last_reviewed_at,
    next_review_at = excluded.next_review_at,
    mastered_at = excluded.mastered_at;

  update public.quiz_attempts
  set rating = p_rating
  where id = selected_attempt.id;

  update public.learning_session_items
  set
    progress_applied_at = now(),
    completed_at = coalesce(completed_at, now())
  where session_id = p_session_id
    and position = p_position
    and user_id = (select auth.uid());

  return true;
end;
$$;

revoke all on function public.apply_learning_review(
  uuid, integer, public.review_rating, public.learning_status,
  integer, integer, integer, integer, numeric, timestamptz, timestamptz
) from public, anon;

grant execute on function public.apply_learning_review(
  uuid, integer, public.review_rating, public.learning_status,
  integer, integer, integer, integer, numeric, timestamptz, timestamptz
) to authenticated;

commit;
