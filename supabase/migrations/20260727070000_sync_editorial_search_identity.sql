grant update (word, reading, character, pattern)
  on public.content_items
  to authenticated;

create function private.sync_editorial_search_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_type public.content_type;
begin
  select content_type
  into selected_type
  from public.content_items
  where id = new.content_item_id;

  update public.content_items
  set
    word = case when selected_type = 'vocabulary' then btrim(new.title) end,
    reading = case when selected_type = 'vocabulary' then btrim(new.reading) end,
    character = case when selected_type = 'kanji' then btrim(new.title) end,
    pattern = case when selected_type = 'grammar' then btrim(new.title) end
  where id = new.content_item_id;

  return new;
end;
$$;

revoke all on function private.sync_editorial_search_identity() from public;

create trigger editorial_content_details_sync_search_identity
after insert or update of title, reading
on public.editorial_content_details
for each row execute function private.sync_editorial_search_identity();
