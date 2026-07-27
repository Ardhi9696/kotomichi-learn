import type { Metadata } from 'next';
import Link from 'next/link';

import { requestPasswordReset } from '@/app/auth/actions';
import { AuthMessage } from '@/components/auth/auth-message';
import { AuthShell } from '@/components/auth/auth-shell';
import { SubmitButton } from '@/components/auth/submit-button';

export const metadata: Metadata = {
  title: 'Pulihkan password',
};

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <AuthShell
      description="Kami akan mengirim tautan aman untuk membuat password baru."
      eyebrow="Pemulihan akun"
      footer={
        <Link className="font-semibold text-primary hover:underline" href="/auth/login">
          Kembali ke halaman masuk
        </Link>
      }
      title="Temukan kembali jalanmu."
    >
      <AuthMessage error={error} />
      <form action={requestPasswordReset} className="grid gap-5">
        <label className="grid gap-1.5 text-sm font-semibold">
          Email akun
          <input
            autoComplete="email"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            name="email"
            placeholder="nama@email.com"
            required
            type="email"
          />
        </label>
        <SubmitButton pendingLabel="Mengirim tautan…">Kirim tautan pemulihan</SubmitButton>
      </form>
    </AuthShell>
  );
}
