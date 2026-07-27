alter table public.content_reports
  add constraint content_reports_field_allowed check (
    field_name in ('meaning', 'reading', 'example', 'metadata', 'other')
  ),
  add constraint content_reports_resolution_state check (
    (
      status in ('open', 'triaged')
      and resolved_by is null
      and resolved_at is null
    )
    or (
      status in ('resolved', 'rejected')
      and resolved_by is not null
      and resolved_at is not null
      and resolution_notes is not null
      and btrim(resolution_notes) <> ''
    )
  );

create unique index content_reports_active_reporter_unique
  on public.content_reports (reporter_id, content_item_id, locale, field_name)
  where reporter_id is not null
    and status in ('open', 'triaged');

revoke update on public.content_reports from authenticated;
grant update (status, resolution_notes, resolved_by, resolved_at)
  on public.content_reports
  to authenticated;
