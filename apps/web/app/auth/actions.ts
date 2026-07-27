'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { safeRedirectPath } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/server';

const emailSchema = z.email('Masukkan alamat email yang valid.');
const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .max(128, 'Password maksimal 128 karakter.');
const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Nama minimal 2 karakter.')
  .max(60, 'Nama maksimal 60 karakter.');

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function messageRedirect(
  path: string,
  kind: 'error' | 'message',
  message: string,
  extra?: Record<string, string>,
): never {
  const search = new URLSearchParams({ [kind]: message, ...extra });
  redirect(`${path}?${search.toString()}`);
}

async function requestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'
  );
}

export async function login(formData: FormData): Promise<never> {
  const emailResult = emailSchema.safeParse(formString(formData, 'email'));
  const passwordResult = passwordSchema.safeParse(formString(formData, 'password'));
  const next = safeRedirectPath(formData.get('next'));

  if (!emailResult.success || !passwordResult.success) {
    messageRedirect(
      '/auth/login',
      'error',
      emailResult.error?.issues[0]?.message ??
        passwordResult.error?.issues[0]?.message ??
        'Periksa kembali data login.',
      { next },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailResult.data,
    password: passwordResult.data,
  });

  if (error) {
    messageRedirect('/auth/login', 'error', 'Email atau password tidak sesuai.', {
      next,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  redirect(profile?.onboarding_completed_at ? next : '/onboarding');
}

export async function signInWithGoogle(formData: FormData): Promise<never> {
  const next = safeRedirectPath(formData.get('next'));
  const authPath =
    formString(formData, 'auth_path') === '/auth/register'
      ? '/auth/register'
      : '/auth/login';
  const origin = await requestOrigin();
  const callbackUrl = new URL('/auth/confirm', origin);
  callbackUrl.searchParams.set('next', next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    messageRedirect(
      authPath,
      'error',
      'Login dengan Google belum dapat dimulai. Coba kembali beberapa saat lagi.',
      { next },
    );
  }

  redirect(data.url);
}

export async function register(formData: FormData): Promise<never> {
  const emailResult = emailSchema.safeParse(formString(formData, 'email'));
  const passwordResult = passwordSchema.safeParse(formString(formData, 'password'));
  const displayNameResult = displayNameSchema.safeParse(
    formString(formData, 'display_name'),
  );

  if (!emailResult.success || !passwordResult.success || !displayNameResult.success) {
    messageRedirect(
      '/auth/register',
      'error',
      emailResult.error?.issues[0]?.message ??
        passwordResult.error?.issues[0]?.message ??
        displayNameResult.error?.issues[0]?.message ??
        'Periksa kembali data pendaftaran.',
    );
  }

  const supabase = await createClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: emailResult.data,
    password: passwordResult.data,
    options: {
      data: { display_name: displayNameResult.data },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    messageRedirect(
      '/auth/register',
      'error',
      'Akun belum dapat dibuat. Coba kembali beberapa saat lagi.',
    );
  }

  if (data.session) redirect('/onboarding');

  messageRedirect(
    '/auth/login',
    'message',
    'Periksa email untuk mengaktifkan akun Kotomichi.',
  );
}

export async function requestPasswordReset(formData: FormData): Promise<never> {
  const emailResult = emailSchema.safeParse(formString(formData, 'email'));

  if (!emailResult.success) {
    messageRedirect('/auth/forgot-password', 'error', emailResult.error.issues[0].message);
  }

  const supabase = await createClient();
  const origin = await requestOrigin();
  await supabase.auth.resetPasswordForEmail(emailResult.data, {
    redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
  });

  messageRedirect(
    '/auth/login',
    'message',
    'Jika email terdaftar, tautan pemulihan telah dikirim.',
  );
}

export async function updatePassword(formData: FormData): Promise<never> {
  const passwordResult = passwordSchema.safeParse(formString(formData, 'password'));
  const confirmation = formString(formData, 'password_confirmation');

  if (!passwordResult.success) {
    messageRedirect(
      '/auth/update-password',
      'error',
      passwordResult.error.issues[0].message,
    );
  }
  if (passwordResult.data !== confirmation) {
    messageRedirect('/auth/update-password', 'error', 'Konfirmasi password tidak sama.');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: passwordResult.data });

  if (error) {
    messageRedirect(
      '/auth/update-password',
      'error',
      'Password belum dapat diperbarui. Minta tautan pemulihan baru.',
    );
  }

  messageRedirect('/dashboard', 'message', 'Password berhasil diperbarui.');
}

export async function logout(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
