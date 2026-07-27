import type { Metadata } from 'next';

import { deleteAccount, updateProfile } from '@/app/settings/actions';
import { AuthMessage } from '@/components/auth/auth-message';
import { SubmitButton } from '@/components/auth/submit-button';
import { ThemePreferenceSelect } from '@/components/theme-preference-select';
import { LEVELS } from '@/features/catalog/types';
import type { ThemePreference } from '@/features/settings/profile-schema';
import { requireUser } from '@/lib/auth/require-user';

export const metadata: Metadata = {
  title: 'Pengaturan akun',
};

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const locales = [
  { value: 'id', label: 'Indonesia' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
] as const;

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name,avatar_url,content_locale,interface_locale,target_level,daily_goal,theme',
    )
    .eq('id', user.id)
    .single();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const profileTheme: ThemePreference =
    profile?.theme === 'light' ||
    profile?.theme === 'dark' ||
    profile?.theme === 'system'
      ? profile.theme
      : 'system';

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="border-b border-border pb-8">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Profil dan preferensi
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Pengaturan akun</h1>
        <p className="mt-3 text-muted-foreground">{user.email}</p>
      </header>

      <div className="mt-8">
        <AuthMessage error={error} message={message} />
      </div>

      <form
        action={updateProfile}
        className="mt-6 grid gap-6 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Nama tampilan
            <input
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.display_name ?? ''}
              maxLength={60}
              name="display_name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL avatar
            <input
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.avatar_url ?? ''}
              maxLength={500}
              name="avatar_url"
              placeholder="https://…"
              type="url"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Bahasa materi
            <select
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.content_locale ?? 'id'}
              name="content_locale"
            >
              {locales.map((locale) => (
                <option key={locale.value} value={locale.value}>
                  {locale.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Bahasa antarmuka
            <select
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.interface_locale ?? 'id'}
              name="interface_locale"
            >
              {locales.map((locale) => (
                <option key={locale.value} value={locale.value}>
                  {locale.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Target JLPT
            <select
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.target_level ?? 'N5'}
              name="target_level"
            >
              {LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Target item harian
            <input
              className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
              defaultValue={profile?.daily_goal ?? 10}
              max={200}
              min={1}
              name="daily_goal"
              required
              type="number"
            />
          </label>
          <ThemePreferenceSelect initialTheme={profileTheme} />
        </div>
        <div className="max-w-xs">
          <SubmitButton pendingLabel="Menyimpan…">Simpan pengaturan</SubmitButton>
        </div>
      </form>

      <section className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-serif text-2xl font-bold">Ekspor data</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Unduh profil, progres, sesi, jawaban kuis, peran, dan laporan milikmu
            dalam format JSON.
          </p>
          <a
            className="mt-5 inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
            href="/settings/export"
          >
            Unduh data akun
          </a>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-950">
          <h2 className="font-serif text-2xl font-bold">Hapus akun</h2>
          <p className="mt-2 text-sm leading-6">
            Tindakan ini permanen dan menghapus profil serta seluruh progres belajar.
          </p>
          <form action={deleteAccount} className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Ketik HAPUS untuk konfirmasi
              <input
                autoComplete="off"
                className="h-11 rounded-xl border border-red-300 bg-white px-4 font-normal"
                name="confirmation"
                required
              />
            </label>
            <button
              className="h-11 rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800"
              type="submit"
            >
              Hapus akun permanen
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
