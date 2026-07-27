import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthMessage } from '@/components/auth/auth-message';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleAuthForm } from '@/components/auth/google-auth-form';
import { SubmitButton } from '@/components/auth/submit-button';
import { login } from '@/lib/auth/actions';
import { safeRedirectPath } from '@/lib/auth/safe-redirect';

export const metadata: Metadata = {
  title: 'Masuk',
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeRedirectPath(first(params.next));

  return (
    <AuthShell
      description="Lanjutkan target, review, dan progres belajarmu."
      eyebrow="Selamat datang kembali"
      footer={
        <p>
          Belum memiliki akun?{' '}
          <Link className="font-semibold text-primary hover:underline" href="/auth/register">
            Buat akun gratis
          </Link>
        </p>
      }
      title="Masuk ke perjalananmu."
    >
      <AuthMessage error={first(params.error)} message={first(params.message)} />
      <GoogleAuthForm authPath="/auth/login" next={next} />
      <form action={login} className="grid gap-5">
        <input name="next" type="hidden" value={next} />
        <label className="grid gap-1.5 text-sm font-semibold">
          Email
          <input
            autoComplete="email"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            name="email"
            placeholder="nama@email.com"
            required
            type="email"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          <span className="flex items-center justify-between gap-3">
            Password
            <Link
              className="text-xs font-semibold text-primary hover:underline"
              href="/auth/forgot-password"
            >
              Lupa password?
            </Link>
          </span>
          <input
            autoComplete="current-password"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <SubmitButton pendingLabel="Sedang masuk…">Masuk</SubmitButton>
      </form>
    </AuthShell>
  );
}
