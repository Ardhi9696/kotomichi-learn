import { requireSuperadmin } from '@/lib/auth/require-superadmin';
import type { Enums } from '@/lib/supabase/database.types';

export type RoleAssignment = {
  userId: string;
  displayName: string;
  role: Enums<'app_role'>;
  createdAt: string;
};

export type AdminDashboardData = {
  activeSnapshotVersion: string | null;
  activeContentCount: number;
  openReportCount: number;
  publishedTranslationCount: number;
  roleAssignments: RoleAssignment[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const { supabase } = await requireSuperadmin();
  const [
    snapshotResult,
    contentResult,
    reportResult,
    vocabTranslationsResult,
    kanjiTranslationsResult,
    grammarTranslationsResult,
    rolesResult,
  ] = await Promise.all([
    supabase
      .from('source_snapshots')
      .select('source_version')
      .eq('status', 'active')
      .order('activated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('content_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('vocab_translations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('kanji_translations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('grammar_translations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('user_roles')
      .select('user_id,role,created_at')
      .order('created_at', { ascending: false }),
  ]);

  const results = [
    snapshotResult,
    contentResult,
    reportResult,
    vocabTranslationsResult,
    kanjiTranslationsResult,
    grammarTranslationsResult,
    rolesResult,
  ];
  if (results.some((result) => result.error)) {
    throw new Error('Data superadmin belum dapat dimuat.');
  }

  const roleRows = rolesResult.data ?? [];
  const userIds = [...new Set(roleRows.map((row) => row.user_id))];
  const profilesResult = userIds.length
    ? await supabase.from('profiles').select('id,display_name').in('id', userIds)
    : { data: [], error: null };
  if (profilesResult.error) throw new Error('Profil pemegang role belum dapat dimuat.');

  const displayNames = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      profile.display_name ?? 'Pengguna tanpa nama',
    ]),
  );

  return {
    activeSnapshotVersion: snapshotResult.data?.source_version ?? null,
    activeContentCount: contentResult.count ?? 0,
    openReportCount: reportResult.count ?? 0,
    publishedTranslationCount:
      (vocabTranslationsResult.count ?? 0) +
      (kanjiTranslationsResult.count ?? 0) +
      (grammarTranslationsResult.count ?? 0),
    roleAssignments: roleRows.map((row) => ({
      userId: row.user_id,
      displayName: displayNames.get(row.user_id) ?? 'Pengguna tanpa nama',
      role: row.role,
      createdAt: row.created_at,
    })),
  };
}
