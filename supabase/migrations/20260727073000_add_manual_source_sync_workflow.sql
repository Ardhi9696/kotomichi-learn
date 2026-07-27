create function private.require_superadmin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'superadmin'::public.app_role
  ) then
    raise exception 'Superadmin access required';
  end if;
end;
$$;

revoke all on function private.require_superadmin() from public;

create function public.create_source_snapshot(
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
begin
  perform private.require_superadmin();

  if btrim(coalesce(p_source_version, '')) = '' then
    raise exception 'Source version is required';
  end if;

  insert into public.source_snapshots (
    source_version,
    source_commit,
    dataset_checksum,
    status
  )
  values (
    btrim(p_source_version),
    nullif(btrim(coalesce(p_source_commit, '')), ''),
    lower(btrim(p_dataset_checksum)),
    'importing'
  )
  returning id into snapshot_id;

  return snapshot_id;
end;
$$;

create function public.import_source_batch(
  p_snapshot_id uuid,
  p_content_type public.content_type,
  p_items jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  item_id uuid;
  item_level public.jlpt_level;
  identity text;
  fingerprint text;
  imported_count integer := 0;
  item_word text;
  item_reading text;
  item_character text;
  item_pattern text;
begin
  perform private.require_superadmin();

  if not exists (
    select 1 from public.source_snapshots
    where id = p_snapshot_id and status = 'importing'
  ) then
    raise exception 'Snapshot is not importable';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Items must be a JSON array';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_level := (item ->> 'level')::public.jlpt_level;
    fingerprint := encode(
      extensions.digest(convert_to(item::text, 'UTF8'), 'sha256'),
      'hex'
    );
    item_word := nullif(btrim(coalesce(item ->> 'word', '')), '');
    item_reading := btrim(coalesce(item ->> 'reading', ''));
    item_character := nullif(btrim(coalesce(item ->> 'character', '')), '');
    item_pattern := nullif(btrim(coalesce(item ->> 'pattern', '')), '');

    identity := case p_content_type
      when 'vocabulary' then
        'vocabulary:' || item_level::text || ':' || coalesce(item_word, '') || ':' || item_reading
      when 'kanji' then
        'kanji:' || item_level::text || ':' || coalesce(item_character, '')
      else
        'grammar:' || item_level::text || ':' || coalesce(item_pattern, '')
    end;

    if (
      (p_content_type = 'vocabulary' and item_word is null)
      or (p_content_type = 'kanji' and item_character is null)
      or (p_content_type = 'grammar' and item_pattern is null)
    ) then
      raise exception 'Invalid % item: %', p_content_type, item;
    end if;

    insert into public.content_items (
      content_type,
      level,
      identity_key,
      word,
      reading,
      character,
      pattern,
      current_snapshot_id,
      current_source_fingerprint,
      first_seen_snapshot_id,
      last_seen_snapshot_id,
      is_active,
      content_origin
    )
    values (
      p_content_type,
      item_level,
      identity,
      case when p_content_type = 'vocabulary' then item_word end,
      case when p_content_type = 'vocabulary' then item_reading end,
      case when p_content_type = 'kanji' then item_character end,
      case when p_content_type = 'grammar' then item_pattern end,
      null,
      null,
      p_snapshot_id,
      p_snapshot_id,
      false,
      'openjlpt'
    )
    on conflict (identity_key)
    do update set last_seen_snapshot_id = excluded.last_seen_snapshot_id
    where public.content_items.content_origin = 'openjlpt'
    returning id into item_id;

    if item_id is null then
      raise exception 'Identity conflicts with editorial content: %', identity;
    end if;

    if p_content_type = 'vocabulary' then
      if jsonb_typeof(coalesce(item -> 'meanings', 'null'::jsonb)) <> 'array'
        or jsonb_array_length(item -> 'meanings') = 0
      then
        raise exception 'Vocabulary meanings must be a non-empty array';
      end if;

      insert into public.vocab (
        content_item_id,
        snapshot_id,
        word,
        reading,
        meanings,
        examples,
        source_fingerprint
      )
      values (
        item_id,
        p_snapshot_id,
        item_word,
        item_reading,
        array(select jsonb_array_elements_text(item -> 'meanings')),
        coalesce(item -> 'examples', '[]'::jsonb),
        fingerprint
      )
      on conflict (snapshot_id, content_item_id)
      do update set
        word = excluded.word,
        reading = excluded.reading,
        meanings = excluded.meanings,
        examples = excluded.examples,
        source_fingerprint = excluded.source_fingerprint;
    elsif p_content_type = 'kanji' then
      insert into public.kanji (
        content_item_id,
        snapshot_id,
        character,
        onyomi,
        kunyomi,
        meanings,
        strokes,
        grade,
        frequency,
        source_fingerprint
      )
      values (
        item_id,
        p_snapshot_id,
        item_character,
        array(select jsonb_array_elements_text(coalesce(item -> 'onyomi', '[]'::jsonb))),
        array(select jsonb_array_elements_text(coalesce(item -> 'kunyomi', '[]'::jsonb))),
        array(select jsonb_array_elements_text(coalesce(item -> 'meanings', '[]'::jsonb))),
        nullif(item ->> 'strokes', '')::integer,
        nullif(item ->> 'grade', '')::integer,
        nullif(item ->> 'frequency', '')::integer,
        fingerprint
      )
      on conflict (snapshot_id, content_item_id)
      do update set
        character = excluded.character,
        onyomi = excluded.onyomi,
        kunyomi = excluded.kunyomi,
        meanings = excluded.meanings,
        strokes = excluded.strokes,
        grade = excluded.grade,
        frequency = excluded.frequency,
        source_fingerprint = excluded.source_fingerprint;
    else
      if btrim(coalesce(item ->> 'meaning', '')) = '' then
        raise exception 'Grammar meaning is required';
      end if;

      insert into public.grammar (
        content_item_id,
        snapshot_id,
        pattern,
        meaning,
        formation,
        examples,
        tags,
        notes,
        source_fingerprint
      )
      values (
        item_id,
        p_snapshot_id,
        item_pattern,
        btrim(item ->> 'meaning'),
        btrim(coalesce(item ->> 'formation', '')),
        coalesce(item -> 'examples', '[]'::jsonb),
        array(select jsonb_array_elements_text(coalesce(item -> 'tags', '[]'::jsonb))),
        btrim(coalesce(item ->> 'notes', '')),
        fingerprint
      )
      on conflict (snapshot_id, content_item_id)
      do update set
        pattern = excluded.pattern,
        meaning = excluded.meaning,
        formation = excluded.formation,
        examples = excluded.examples,
        tags = excluded.tags,
        notes = excluded.notes,
        source_fingerprint = excluded.source_fingerprint;
    end if;

    imported_count := imported_count + 1;
  end loop;

  return imported_count;
end;
$$;

create function public.source_snapshot_diff(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.require_superadmin();

  with candidate as (
    select content_item_id, source_fingerprint from public.vocab
    where snapshot_id = p_snapshot_id
    union all
    select content_item_id, source_fingerprint from public.kanji
    where snapshot_id = p_snapshot_id
    union all
    select content_item_id, source_fingerprint from public.grammar
    where snapshot_id = p_snapshot_id
  ),
  active as (
    select id, current_source_fingerprint
    from public.content_items
    where is_active and content_origin = 'openjlpt'
  ),
  moved as (
    select distinct candidate_item.id
    from candidate
    join public.content_items candidate_item on candidate_item.id = candidate.content_item_id
    join public.content_items active_item
      on active_item.content_type = candidate_item.content_type
      and active_item.is_active
      and active_item.content_origin = 'openjlpt'
      and active_item.level <> candidate_item.level
      and (
        (candidate_item.content_type = 'vocabulary'
          and active_item.word = candidate_item.word
          and active_item.reading = candidate_item.reading)
        or (candidate_item.content_type = 'kanji'
          and active_item.character = candidate_item.character)
        or (candidate_item.content_type = 'grammar'
          and active_item.pattern = candidate_item.pattern)
      )
  )
  select jsonb_build_object(
    'added', (select count(*) from candidate left join active on active.id = candidate.content_item_id where active.id is null),
    'changed', (select count(*) from candidate join active on active.id = candidate.content_item_id where active.current_source_fingerprint is distinct from candidate.source_fingerprint),
    'unchanged', (select count(*) from candidate join active on active.id = candidate.content_item_id where active.current_source_fingerprint = candidate.source_fingerprint),
    'removed', (select count(*) from active left join candidate on candidate.content_item_id = active.id where candidate.content_item_id is null),
    'moved_level', (select count(*) from moved),
    'total', (select count(*) from candidate)
  ) into result;

  return result;
end;
$$;

create function public.validate_source_snapshot(p_snapshot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  vocab_count integer;
  kanji_count integer;
  grammar_count integer;
  counts jsonb;
begin
  perform private.require_superadmin();

  if not exists (
    select 1 from public.source_snapshots
    where id = p_snapshot_id and status = 'importing'
  ) then
    raise exception 'Only importing snapshots can be validated';
  end if;

  select count(*) into vocab_count from public.vocab where snapshot_id = p_snapshot_id;
  select count(*) into kanji_count from public.kanji where snapshot_id = p_snapshot_id;
  select count(*) into grammar_count from public.grammar where snapshot_id = p_snapshot_id;
  counts := jsonb_build_object(
    'vocabulary', vocab_count,
    'kanji', kanji_count,
    'grammar', grammar_count,
    'total', vocab_count + kanji_count + grammar_count
  );

  if vocab_count = 0 or kanji_count = 0 or grammar_count = 0 then
    update public.source_snapshots
    set status = 'failed', item_counts = counts
    where id = p_snapshot_id;
    return counts || jsonb_build_object(
      'valid',
      false,
      'error',
      'Snapshot must contain vocabulary, kanji, and grammar'
    );
  end if;

  update public.source_snapshots
  set status = 'validated', item_counts = counts, validated_at = now()
  where id = p_snapshot_id;

  return counts || jsonb_build_object('valid', true);
end;
$$;

create function public.activate_source_snapshot(p_snapshot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  diff jsonb;
begin
  perform private.require_superadmin();

  if not exists (
    select 1 from public.source_snapshots
    where id = p_snapshot_id and status in ('validated', 'archived')
  ) then
    raise exception 'Snapshot must be validated or archived';
  end if;

  diff := public.source_snapshot_diff(p_snapshot_id);

  update public.source_snapshots
  set status = 'archived'
  where status = 'active' and id <> p_snapshot_id;

  with candidate as (
    select content_item_id, source_fingerprint from public.vocab
    where snapshot_id = p_snapshot_id
    union all
    select content_item_id, source_fingerprint from public.kanji
    where snapshot_id = p_snapshot_id
    union all
    select content_item_id, source_fingerprint from public.grammar
    where snapshot_id = p_snapshot_id
  )
  update public.content_items item
  set
    current_snapshot_id = case
      when candidate.content_item_id is not null then p_snapshot_id
      else item.current_snapshot_id
    end,
    current_source_fingerprint = coalesce(
      candidate.source_fingerprint,
      item.current_source_fingerprint
    ),
    is_active = candidate.content_item_id is not null,
    last_seen_snapshot_id = case
      when candidate.content_item_id is not null then p_snapshot_id
      else item.last_seen_snapshot_id
    end
  from (
    select content.id,
      candidate.content_item_id,
      candidate.source_fingerprint
    from public.content_items content
    left join candidate on candidate.content_item_id = content.id
    where content.content_origin = 'openjlpt'
  ) candidate
  where item.id = candidate.id;

  update public.source_snapshots
  set status = 'active', activated_at = now()
  where id = p_snapshot_id;

  return diff;
end;
$$;

revoke all on function public.create_source_snapshot(text, text, text) from public, anon;
revoke all on function public.import_source_batch(uuid, public.content_type, jsonb) from public, anon;
revoke all on function public.source_snapshot_diff(uuid) from public, anon;
revoke all on function public.validate_source_snapshot(uuid) from public, anon;
revoke all on function public.activate_source_snapshot(uuid) from public, anon;

grant execute on function public.create_source_snapshot(text, text, text) to authenticated;
grant execute on function public.import_source_batch(uuid, public.content_type, jsonb) to authenticated;
grant execute on function public.source_snapshot_diff(uuid) to authenticated;
grant execute on function public.validate_source_snapshot(uuid) to authenticated;
grant execute on function public.activate_source_snapshot(uuid) to authenticated;
