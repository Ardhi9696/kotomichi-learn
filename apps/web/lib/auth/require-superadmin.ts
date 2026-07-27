import { notFound } from 'next/navigation';

import { requireUser } from '@/lib/auth/require-user';

export async function requireSuperadmin() {
  const { supabase, user } = await requireUser();
  const { data: role, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'superadmin')
    .maybeSingle();

  if (error) throw new Error('Hak akses belum dapat diverifikasi.');
  if (!role) notFound();

  return { supabase, user };
}
