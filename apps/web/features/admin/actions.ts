'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assignRoleSchema, removeRoleSchema } from '@/features/admin/role-schema';
import { requireSuperadmin } from '@/lib/auth/require-superadmin';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function adminRedirect(kind: 'error' | 'message', message: string): never {
  redirect(`/admin?${kind}=${encodeURIComponent(message)}`);
}

export async function assignUserRole(formData: FormData): Promise<never> {
  const result = assignRoleSchema.safeParse({
    email: formString(formData, 'email'),
    role: formString(formData, 'role'),
  });
  if (!result.success) {
    adminRedirect('error', result.error.issues[0]?.message ?? 'Data role tidak valid.');
  }

  const { supabase } = await requireSuperadmin();
  const { error } = await supabase.rpc('assign_user_role_by_email', {
    p_email: result.data.email,
    p_role: result.data.role,
  });

  if (error) {
    const message = error.message.includes('User not found')
      ? 'Akun dengan email tersebut belum terdaftar.'
      : 'Role belum dapat ditambahkan.';
    adminRedirect('error', message);
  }

  revalidatePath('/admin');
  adminRedirect('message', `Role ${result.data.role} berhasil ditambahkan.`);
}

export async function removeUserRole(formData: FormData): Promise<never> {
  const result = removeRoleSchema.safeParse({
    userId: formString(formData, 'user_id'),
    role: formString(formData, 'role'),
  });
  if (!result.success) adminRedirect('error', 'Role yang dipilih tidak valid.');

  const { supabase } = await requireSuperadmin();
  const { data: removed, error } = await supabase.rpc('remove_user_role', {
    p_user_id: result.data.userId,
    p_role: result.data.role,
  });

  if (error || !removed) adminRedirect('error', 'Role belum dapat dihapus.');

  revalidatePath('/admin');
  adminRedirect('message', `Role ${result.data.role} berhasil dihapus.`);
}
