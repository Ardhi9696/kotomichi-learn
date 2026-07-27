import type { Metadata } from 'next';

import { updatePassword } from '@/app/auth/actions';
import { AuthMessage } from '@/components/auth/auth-message';
import { AuthShell } from '@/components/auth/auth-shell';
import { SubmitButton } from '@/components/auth/submit-button';
import { requireUser } from '@/lib/auth/require-user';

export const metadata: Metadata = {
  title: 'Buat password baru',
};

type UpdatePasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  await requireUser();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <AuthShell
      description="Gunakan password baru yang kuat dan tidak dipakai pada layanan lain."
      eyebrow="Keamanan akun"
      title="Buat password baru."
    >
      <AuthMessage error={error} />
      <form action={updatePassword} className="grid gap-5">
        <label className="grid gap-1.5 text-sm font-semibold">
          Password baru
          <input
            autoComplete="new-password"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Ulangi password baru
          <input
            autoComplete="new-password"
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            minLength={8}
            name="password_confirmation"
            required
            type="password"
          />
        </label>
        <SubmitButton pendingLabel="Memperbarui…">Simpan password baru</SubmitButton>
      </form>
    </AuthShell>
  );
}
