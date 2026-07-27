import type { Metadata } from 'next';
import Link from 'next/link';

import { SubmitButton } from '@/components/auth/submit-button';
import { CONTENT_TYPES, LEVELS } from '@/features/catalog/types';
import { createLearningSession } from '@/features/learning/actions';
import { getLearningHomeData } from '@/features/learning/queries';
import { SESSION_ITEM_COUNTS } from '@/features/learning/session-schema';

export const metadata: Metadata = {
  title: 'Mulai sesi belajar',
};

const contentTypeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

type LearnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const data = await getLearningHomeData();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const defaultItemCount = SESSION_ITEM_COUNTS.some((count) => count === data.dailyGoal)
    ? data.dailyGoal
    : 10;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
          Sesi belajar
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Pilih langkah kecil untuk hari ini.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Pelajari flashcard sesuai targetmu. Sesi tersimpan otomatis dan dapat dilanjutkan
          kapan saja.
        </p>
      </header>

      {error ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {data.activeSessions.length ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-bold">Lanjutkan sesi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.activeSessions.map((session) => (
              <Link
                className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/35 hover:shadow-card"
                href={`/learn/${session.id}`}
                key={session.id}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{session.level}</span>
                  <span className="text-sm text-muted-foreground">
                    {session.completed_item_count}/{session.target_item_count}
                  </span>
                </div>
                <p className="mt-3 font-semibold">
                  {session.content_types.map((type) => contentTypeLabels[type]).join(' · ')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Buka flashcard berikutnya →</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <form action={createLearningSession} className="mt-10 grid gap-6">
        <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <legend className="px-2 text-lg font-semibold">1. Level</legend>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {LEVELS.map((level) => (
              <label className="cursor-pointer" key={level}>
                <input
                  className="peer sr-only"
                  defaultChecked={data.targetLevel === level}
                  name="level"
                  type="radio"
                  value={level}
                />
                <span className="grid min-h-16 place-items-center rounded-xl border border-border bg-background font-bold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
            <legend className="px-2 text-lg font-semibold">2. Jenis materi</legend>
            <div className="mt-4 grid gap-3">
              {CONTENT_TYPES.map((type) => (
                <label className="cursor-pointer" key={type}>
                  <input
                    className="peer sr-only"
                    defaultChecked
                    name="content_type"
                    type="checkbox"
                    value={type}
                  />
                  <span className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 font-semibold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                    {contentTypeLabels[type]}
                    <span aria-hidden="true">✓</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
            <legend className="px-2 text-lg font-semibold">3. Jumlah flashcard</legend>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {SESSION_ITEM_COUNTS.map((count) => (
                <label className="cursor-pointer" key={count}>
                  <input
                    className="peer sr-only"
                    defaultChecked={defaultItemCount === count}
                    name="item_count"
                    type="radio"
                    value={count}
                  />
                  <span className="grid min-h-20 place-items-center rounded-xl border border-border bg-background text-xl font-bold transition peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2">
                    {count}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <SubmitButton pendingLabel="Menyiapkan sesi…">Mulai sesi belajar</SubmitButton>
        </div>
      </form>
    </div>
  );
}
