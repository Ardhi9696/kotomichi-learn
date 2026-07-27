import { AppShell, type AppViewer } from '@/components/app-shell';
import type { ThemePreference } from '@/features/settings/profile-schema';
import { createClient } from '@/lib/supabase/server';

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profileResult, rolesResult] = user
    ? await Promise.all([
        supabase
          .from('profiles')
          .select('display_name,target_level,theme')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', user.id),
      ])
    : [{ data: null }, { data: [] }];
  const profile = profileResult.data;
  const theme: ThemePreference =
    profile?.theme === 'light' || profile?.theme === 'dark' || profile?.theme === 'system'
      ? profile.theme
      : 'system';
  const viewer: AppViewer = {
    displayName: profile?.display_name ?? user?.email?.split('@')[0] ?? 'Learner',
    email: user?.email ?? '',
    targetLevel: profile?.target_level ?? 'N5',
    theme,
    roles: rolesResult.data?.map((row) => row.role) ?? [],
  };

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
