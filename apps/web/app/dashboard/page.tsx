import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import { getDashboardData } from '@/features/dashboard/queries';

export const metadata: Metadata = {
  title: 'Dashboard belajar',
};

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatActivityDay(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

const CONTENT_TYPE_LABELS = {
  vocabulary: 'Kosakata',
  kanji: 'Kanji',
  grammar: 'Tata bahasa',
} as const;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const data = await getDashboardData();
  const params = await searchParams;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const maxDailyItems = Math.max(
    data.dailyGoal,
    ...data.dailyActivity.map((activity) => activity.completedItems),
    1,
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      {message ? (
        <div
          className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
        >
          {message}
        </div>
      ) : null}

      <header className="grid gap-6 border-b border-border pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            おかえりなさい · Selamat datang kembali
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Halo, {data.displayName}.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Target aktifmu adalah {data.targetLevel}. Ambil satu langkah kecil hari ini.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            href="/learn"
          >
            Mulai belajar
          </Link>
          <Link
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            href="/review"
          >
            Buka review
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-primary p-6 text-white shadow-[0_18px_45px_rgb(201_44_35_/_20%)]">
          <p className="text-xs font-bold tracking-wider text-white/65 uppercase">
            Target hari ini
          </p>
          <p className="mt-5 text-4xl font-bold">
            {data.todayCompletedItems}
            <span className="text-lg text-white/65">/{data.dailyGoal}</span>
          </p>
          <div
            aria-label={`Target harian ${data.dailyGoalProgress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={data.dailyGoalProgress}
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${data.dailyGoalProgress}%` }}
            />
          </div>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Streak aktif
          </p>
          <p className="mt-5 text-4xl font-bold">{data.currentStreak} hari</p>
          <p className="mt-1 text-sm text-muted-foreground">
            rekor terpanjang {data.longestStreak} hari
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Review hari ini
          </p>
          <p className="mt-5 text-4xl font-bold">{data.dueItems}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.dueItems ? 'item menunggu review' : 'semua review sudah selesai'}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Akurasi 7 hari
          </p>
          <p className="mt-5 text-4xl font-bold">{data.weeklyAccuracy}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            berdasarkan {data.weeklyAttempts} jawaban
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Tujuh hari terakhir
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Ritme belajar</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-bold text-foreground">
              {data.weeklyCompletedItems}
            </span>{' '}
            item selesai
          </p>
        </div>
        <div
          aria-label="Aktivitas belajar tujuh hari terakhir"
          className="mt-8 grid h-52 grid-cols-7 items-end gap-2 sm:gap-4"
          role="img"
        >
          {data.dailyActivity.map((activity) => {
            const barHeight = Math.max(
              activity.completedItems > 0 ? 8 : 2,
              Math.round((activity.completedItems / maxDailyItems) * 100),
            );
            return (
              <div
                className="flex h-full min-w-0 flex-col items-center justify-end gap-2"
                key={activity.date}
                title={`${activity.completedItems} item pada ${activity.date}`}
              >
                <span className="text-xs font-bold">{activity.completedItems}</span>
                <div className="flex h-32 w-full items-end justify-center rounded-xl bg-background px-1.5 pt-2">
                  <div
                    className={`w-full max-w-10 rounded-lg ${
                      activity.completedItems >= data.dailyGoal
                        ? 'bg-primary'
                        : 'bg-primary/35'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {formatActivityDay(activity.date)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          Batang merah menandai hari ketika target {data.dailyGoal} item tercapai.
        </p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Jalur {data.targetLevel}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold">Progres keseluruhan</h2>
            </div>
            <span className="text-3xl font-bold">{data.completion}%</span>
          </div>
          <div
            aria-label={`Progres ${data.completion}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={data.completion}
            className="mt-7 h-3 overflow-hidden rounded-full bg-primary-soft"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${data.completion}%` }}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-background p-4">
              <p className="text-muted-foreground">Dikuasai</p>
              <p className="mt-1 text-xl font-bold">{data.masteredItems}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-muted-foreground">Akurasi keseluruhan</p>
              <p className="mt-1 text-xl font-bold">{data.accuracy}%</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {data.contentBreakdown.map((item) => (
              <div className="rounded-xl border border-border p-4" key={item.contentType}>
                <p className="text-xs font-semibold text-muted-foreground">
                  {CONTENT_TYPE_LABELS[item.contentType]}
                </p>
                <p className="mt-2 text-lg font-bold">{item.learned}</p>
                <p className="text-xs text-muted-foreground">
                  {item.mastered} dikuasai
                </p>
              </div>
            ))}
          </div>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
            href={data.dueItems ? '/review' : '/learn'}
          >
            {data.dueItems ? 'Mulai review' : 'Mulai sesi belajar'}
            <ArrowIcon />
          </Link>
        </section>

        <section className="rounded-3xl bg-foreground p-6 text-background sm:p-8">
          <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
            Aktivitas terakhir
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold">Riwayat sesi</h2>
          {data.recentSessions.length ? (
            <ul className="mt-6 divide-y divide-white/12">
              {data.recentSessions.map((session) => (
                <li className="flex items-center justify-between gap-4 py-4" key={session.id}>
                  <div>
                    <p className="font-semibold">
                      {session.completed_item_count} item · {session.level}
                    </p>
                    <p className="text-xs text-background/55">
                      {session.session_mode === 'review' ? 'Review' : 'Belajar'} ·{' '}
                      {formatSessionDate(session.started_at)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-accent">
                    {session.completed_item_count > 0
                      ? Math.round(
                          (session.correct_item_count / session.completed_item_count) * 100,
                        )
                      : 0}
                    %
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/12 p-5">
              <p className="font-semibold">Belum ada sesi</p>
              <p className="mt-2 text-sm leading-6 text-background/60">
                Riwayat dan akurasi akan muncul setelah kamu menyelesaikan sesi pertama.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
