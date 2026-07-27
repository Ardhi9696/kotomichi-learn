import type { Metadata } from 'next';
import Link from 'next/link';

import { register } from '@/app/auth/actions';
import { AuthMessage } from '@/components/auth/auth-message';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleAuthForm } from '@/components/auth/google-auth-form';
import { SubmitButton } from '@/components/auth/submit-button';

export const metadata: Metadata = {
  title: 'Buat akun',
};

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      description="Simpan progres dan lanjutkan belajar dari perangkat mana pun."
      eyebrow="Akun baru"
      footer={
        <p>
          Sudah memiliki akun?{' '}
          <Link className="font-semibold text-primary hover:underline" href="/auth/login">
            Masuk di sini
          </Link>
        </p>
      }
      title="Mulai membangun kebiasaan."
    >
      <AuthMessage error={first(params.error)} />
      <GoogleAuthForm authPath="/auth/register" next="/onboarding" />
      <form action={register} className="grid gap-5">
        <label className="grid gap-1.5 text-sm font-semibold">
          Nama
          <input
            autoComplete="name"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            maxLength={60}
            minLength={2}
            name="display_name"
            placeholder="Nama panggilan"
            required
          />
        </label>
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
          Password
          <input
            autoComplete="new-password"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
          <span className="text-xs font-normal text-muted-foreground">
            Minimal 8 karakter.
          </span>
        </label>
        <SubmitButton pendingLabel="Membuat akun…">Buat akun</SubmitButton>
      </form>
    </AuthShell>
  );
}
