create or replace function private.has_any_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and (
        role = 'superadmin'::public.app_role
        or role = any(required_roles)
      )
  );
$$;

revoke all on function private.has_any_role(public.app_role[]) from public;
grant execute on function private.has_any_role(public.app_role[]) to authenticated;

create policy profiles_superadmin_select
on public.profiles
for select
to authenticated
using (private.has_any_role(array['superadmin']::public.app_role[]));

create or replace function public.assign_user_role_by_email(
  p_email text,
  p_role public.app_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if not exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'superadmin'::public.app_role
  ) then
    raise exception 'Superadmin access required';
  end if;

  if p_role = 'superadmin'::public.app_role then
    raise exception 'Superadmin role cannot be managed from this function';
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_user_id, p_role, (select auth.uid()))
  on conflict (user_id, role)
  do update set granted_by = excluded.granted_by;

  return target_user_id;
end;
$$;

create or replace function public.remove_user_role(
  p_user_id uuid,
  p_role public.app_role
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed_count integer;
begin
  if not exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'superadmin'::public.app_role
  ) then
    raise exception 'Superadmin access required';
  end if;

  if p_role = 'superadmin'::public.app_role then
    raise exception 'Superadmin role cannot be managed from this function';
  end if;

  delete from public.user_roles
  where user_id = p_user_id
    and role = p_role;

  get diagnostics removed_count = row_count;
  return removed_count > 0;
end;
$$;

revoke all on function public.assign_user_role_by_email(text, public.app_role) from public;
revoke all on function public.assign_user_role_by_email(text, public.app_role) from anon;
grant execute on function public.assign_user_role_by_email(text, public.app_role) to authenticated;

revoke all on function public.remove_user_role(uuid, public.app_role) from public;
revoke all on function public.remove_user_role(uuid, public.app_role) from anon;
grant execute on function public.remove_user_role(uuid, public.app_role) to authenticated;
