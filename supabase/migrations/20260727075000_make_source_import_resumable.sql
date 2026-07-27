create or replace function public.create_source_snapshot(
  p_source_version text,
  p_source_commit text,
  p_dataset_checksum text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot_id uuid;
  normalized_version text := btrim(coalesce(p_source_version, ''));
  normalized_checksum text := lower(btrim(coalesce(p_dataset_checksum, '')));
begin
  perform private.require_superadmin();

  if normalized_version = '' then
    raise exception 'Source version is required';
  end if;

  insert into public.source_snapshots (
    source_version,
    source_commit,
    dataset_checksum,
    status
  )
  values (
    normalized_version,
    nullif(btrim(coalesce(p_source_commit, '')), ''),
    normalized_checksum,
    'importing'
  )
  on conflict (source_version, dataset_checksum)
  do update set
    source_commit = excluded.source_commit,
    status = case
      when public.source_snapshots.status in ('importing', 'failed')
        then 'importing'::public.snapshot_status
      else public.source_snapshots.status
    end
  returning id into snapshot_id;

  if not exists (
    select 1 from public.source_snapshots
    where id = snapshot_id and status = 'importing'
  ) then
    raise exception 'This source version has already been finalized';
  end if;

  return snapshot_id;
end;
$$;

revoke all on function public.create_source_snapshot(text, text, text) from public, anon;
grant execute on function public.create_source_snapshot(text, text, text) to authenticated;
