import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { completeOnboarding } from '@/app/onboarding/actions';
import { AuthMessage } from '@/components/auth/auth-message';
import { SubmitButton } from '@/components/auth/submit-button';
import { LEVELS } from '@/features/catalog/types';
import { requireUser } from '@/lib/auth/require-user';

export const metadata: Metadata = {
  title: 'Siapkan perjalanan belajar',
};

const levelDescriptions = {
  N5: 'Baru mulai bahasa Jepang',
  N4: 'Menguasai dasar sehari-hari',
  N3: 'Menuju tingkat menengah',
  N2: 'Membaca konteks kompleks',
  N1: 'Mengasah nuansa lanjutan',
} as const;

const localeOptions = [
  { value: 'id', label: 'Indonesia', note: 'Fallback ke Inggris jika belum tersedia' },
  { value: 'ko', label: '한국어', note: '영어 콘텐츠로 자동 대체' },
  { value: 'en', label: 'English', note: 'Canonical OpenJLPT content' },
] as const;

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const isEditing = params.edit === '1';
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_level,content_locale,daily_goal,onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at && !isEditing) redirect('/dashboard');

  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="paper-grid min-h-[calc(100vh-7rem)] px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
            Tiga pilihan sederhana
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight font-bold sm:text-5xl">
            Atur jalan yang terasa pas.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Semua pilihan dapat diubah nanti tanpa menghapus progres.
          </p>
        </div>

        <form action={completeOnboarding} className="mt-10 grid gap-6">
          <AuthMessage error={error} />

          <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
            <legend className="px-2 text-lg font-semibold">1. Target JLPT</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              {LEVELS.map((level) => (
                <label className="group cursor-pointer" key={level}>
                  <input
                    className="peer sr-only"
                    defaultChecked={(profile?.target_level ?? 'N5') === level}
                    name="target_level"
                    type="radio"
                    value={level}
                  />
                  <span className="flex min-h-28 flex-col rounded-2xl border border-border bg-background p-4 transition group-hover:border-primary/35 peer-checked:border-primary peer-checked:bg-primary-soft peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                    <span className="text-xl font-bold peer-checked:text-primary">{level}</span>
                    <span className="mt-auto text-xs leading-5 text-muted-foreground">
                      {levelDescriptions[level]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 md:grid-cols-2">
            <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
              <legend className="px-2 text-lg font-semibold">2. Bahasa materi</legend>
              <div className="mt-4 grid gap-3">
                {localeOptions.map((locale) => (
                  <label className="cursor-pointer" key={locale.value}>
                    <input
                      className="peer sr-only"
                      defaultChecked={(profile?.content_locale ?? 'id') === locale.value}
                      name="content_locale"
                      type="radio"
                      value={locale.value}
                    />
                    <span className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition peer-checked:border-primary peer-checked:bg-primary-soft peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      <span>
                        <span className="block font-semibold">{locale.label}</span>
                        <span className="block text-xs text-muted-foreground">{locale.note}</span>
                      </span>
                      <span className="size-3 rounded-full border-2 border-border peer-checked:border-primary peer-checked:bg-primary" />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
              <legend className="px-2 text-lg font-semibold">3. Target harian</legend>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[5, 10, 20, 30].map((goal) => (
                  <label className="cursor-pointer" key={goal}>
                    <input
                      className="peer sr-only"
                      defaultChecked={(profile?.daily_goal ?? 10) === goal}
                      name="daily_goal"
                      type="radio"
                      value={goal}
                    />
                    <span className="grid min-h-24 place-items-center rounded-2xl border border-border bg-background text-center transition peer-checked:border-primary peer-checked:bg-primary-soft peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
                      <span>
                        <span className="block text-2xl font-bold">{goal}</span>
                        <span className="text-xs text-muted-foreground">item / hari</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <SubmitButton pendingLabel="Menyiapkan perjalanan…">
              Simpan dan buka dashboard
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
