drop policy profiles_own_select on public.profiles;
drop policy profiles_superadmin_select on public.profiles;

create policy profiles_authenticated_select
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.has_any_role(array['superadmin']::public.app_role[])
);
