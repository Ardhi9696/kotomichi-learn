import type { Metadata } from 'next';
import Link from 'next/link';

import { logout } from '@/app/auth/actions';
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

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const data = await getDashboardData();
  const params = await searchParams;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;

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
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            href="/onboarding?edit=1"
          >
            Ubah target
          </Link>
          <form action={logout}>
            <button
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
              type="submit"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-primary p-6 text-white shadow-[0_18px_45px_rgb(201_44_35_/_20%)]">
          <p className="text-xs font-bold tracking-wider text-white/65 uppercase">
            Review hari ini
          </p>
          <p className="mt-5 text-4xl font-bold">{data.dueItems}</p>
          <p className="mt-1 text-sm text-white/70">
            {data.dueItems ? 'item menunggu review' : 'belum ada review jatuh tempo'}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Dikuasai
          </p>
          <p className="mt-5 text-4xl font-bold">{data.masteredItems}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            dari {data.totalItems.toLocaleString('id-ID')} materi {data.targetLevel}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Akurasi
          </p>
          <p className="mt-5 text-4xl font-bold">{data.accuracy}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            berdasarkan {data.attempts} jawaban
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Target harian
          </p>
          <p className="mt-5 text-4xl font-bold">{data.dailyGoal}</p>
          <p className="mt-1 text-sm text-muted-foreground">item baru atau review</p>
        </article>
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
              <p className="text-muted-foreground">Sedang dipelajari</p>
              <p className="mt-1 text-xl font-bold">{data.learningItems}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-muted-foreground">Bahasa materi</p>
              <p className="mt-1 text-xl font-bold uppercase">{data.contentLocale}</p>
            </div>
          </div>
          <Link
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
            href={`/catalog?level=${data.targetLevel}&type=all`}
          >
            Pilih materi berikutnya
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
