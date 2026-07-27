'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  deleteAccountSchema,
  profileSchema,
} from '@/features/settings/profile-schema';
import { requireUser } from '@/lib/auth/require-user';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function settingsRedirect(kind: 'error' | 'message', value: string): never {
  redirect(`/settings?${kind}=${encodeURIComponent(value)}`);
}

export async function updateProfile(formData: FormData): Promise<never> {
  const result = profileSchema.safeParse({
    display_name: formString(formData, 'display_name'),
    avatar_url: formString(formData, 'avatar_url'),
    content_locale: formString(formData, 'content_locale'),
    interface_locale: formString(formData, 'interface_locale'),
    target_level: formString(formData, 'target_level'),
    daily_goal: formString(formData, 'daily_goal'),
    theme: formString(formData, 'theme'),
  });

  if (!result.success) {
    settingsRedirect(
      'error',
      result.error.issues[0]?.message ?? 'Periksa kembali pengaturan akun.',
    );
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from('profiles')
    .update({
      ...result.data,
      avatar_url: result.data.avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) settingsRedirect('error', 'Pengaturan belum dapat disimpan.');

  revalidatePath('/', 'layout');
  settingsRedirect('message', 'Pengaturan akun berhasil disimpan.');
}

export async function deleteAccount(formData: FormData): Promise<never> {
  const result = deleteAccountSchema.safeParse({
    confirmation: formString(formData, 'confirmation'),
  });

  if (!result.success) {
    settingsRedirect('error', result.error.issues[0]?.message ?? 'Konfirmasi salah.');
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc('delete_own_account');

  if (error) settingsRedirect('error', 'Akun belum dapat dihapus.');

  await supabase.auth.signOut();
  redirect('/?message=Akun+berhasil+dihapus');
}
