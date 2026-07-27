create function public.get_learning_activity(p_timezone text default 'Asia/Jakarta')
returns table (
  activity_date date,
  completed_items bigint,
  correct_answers bigint,
  total_answers bigint,
  sessions_completed bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with item_activity as (
    select
      timezone(p_timezone, completed_at)::date as activity_date,
      count(*) as completed_items
    from public.learning_session_items
    where user_id = (select auth.uid())
      and completed_at is not null
    group by 1
  ),
  attempt_activity as (
    select
      timezone(p_timezone, created_at)::date as activity_date,
      count(*) filter (where is_correct) as correct_answers,
      count(*) as total_answers
    from public.quiz_attempts
    where user_id = (select auth.uid())
    group by 1
  ),
  session_activity as (
    select
      timezone(p_timezone, completed_at)::date as activity_date,
      count(*) as sessions_completed
    from public.learning_sessions
    where user_id = (select auth.uid())
      and completed_at is not null
    group by 1
  ),
  activity_dates as (
    select activity_date from item_activity
    union
    select activity_date from attempt_activity
    union
    select activity_date from session_activity
  )
  select
    activity_dates.activity_date,
    coalesce(item_activity.completed_items, 0)::bigint,
    coalesce(attempt_activity.correct_answers, 0)::bigint,
    coalesce(attempt_activity.total_answers, 0)::bigint,
    coalesce(session_activity.sessions_completed, 0)::bigint
  from activity_dates
  left join item_activity using (activity_date)
  left join attempt_activity using (activity_date)
  left join session_activity using (activity_date)
  order by activity_dates.activity_date;
$$;

revoke all on function public.get_learning_activity(text) from public, anon;
grant execute on function public.get_learning_activity(text) to authenticated;
