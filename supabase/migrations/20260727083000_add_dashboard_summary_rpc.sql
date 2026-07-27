create function public.get_dashboard_summary(p_target_level public.jlpt_level)
returns table (
  mastered_count bigint,
  learning_count bigint,
  new_count bigint,
  due_count bigint,
  total_attempts bigint,
  total_correct bigint,
  total_items bigint,
  content_breakdown jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with progress as (
    select
      lp.status,
      lp.attempts_count,
      lp.correct_count,
      lp.next_review_at,
      ci.content_type
    from public.learning_progress lp
    inner join public.content_items ci
      on ci.id = lp.content_item_id
      and ci.level = p_target_level
    where lp.user_id = auth.uid()
  ),
  stats as (
    select
      count(*) filter (where status = 'mastered')::bigint as mastered_count,
      count(*) filter (where status != 'new')::bigint as learning_count,
      count(*) filter (where status = 'new')::bigint as new_count,
      count(*) filter (
        where status in ('learning', 'review')
          and next_review_at is not null
          and next_review_at <= now()
      )::bigint as due_count,
      coalesce(sum(attempts_count), 0)::bigint as total_attempts,
      coalesce(sum(correct_count), 0)::bigint as total_correct
    from progress
  ),
  breakdown as (
    select
      jsonb_agg(
        jsonb_build_object(
          'content_type', content_type,
          'learned', count(*) filter (where status != 'new'),
          'mastered', count(*) filter (where status = 'mastered')
        )
        order by content_type
      ) as content_breakdown
    from progress
    group by content_type
  )
  select
    s.mastered_count,
    s.learning_count,
    s.new_count,
    s.due_count,
    s.total_attempts,
    s.total_correct,
    (select count(*)::bigint from public.content_items where level = p_target_level) as total_items,
    coalesce(b.content_breakdown, '[]'::jsonb) as content_breakdown
  from stats s
  left join breakdown b on true;
$$;

revoke all on function public.get_dashboard_summary from public, anon;
grant execute on function public.get_dashboard_summary(public.jlpt_level) to authenticated;
