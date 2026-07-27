import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth/require-user';
import type { Enums } from '@/lib/supabase/database.types';

const EDITORIAL_ROLES: Enums<'app_role'>[] = [
  'editor',
  'reviewer',
  'admin',
  'superadmin',
];

export async function requireEditorial() {
  const { supabase, user } = await requireUser();
  const { data: roleRows, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', EDITORIAL_ROLES);

  if (error) throw new Error('Hak akses editorial belum dapat diverifikasi.');
  if (!roleRows.length) notFound();

  const roles = roleRows.map((row) => row.role);
  return {
    supabase,
    user,
    roles,
    canManageReports: roles.some((role) =>
      ['reviewer', 'admin', 'superadmin'].includes(role),
    ),
    canReviewTranslations: roles.some((role) =>
      ['reviewer', 'admin', 'superadmin'].includes(role),
    ),
  };
}
