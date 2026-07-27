import type { Metadata } from 'next';
import Link from 'next/link';

import { activateSourceSnapshot } from '@/features/source-sync/actions';
import { getSourceSnapshots } from '@/features/source-sync/queries';
import { SourceImporter } from '@/features/source-sync/source-importer';

export const metadata: Metadata = {
  title: 'Sinkronisasi sumber',
};

type SourcesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const [snapshots, params] = await Promise.all([
    getSourceSnapshots(),
    searchParams,
  ]);
  const message = first(params.message);
  const error = first(params.error);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            OpenJLPT · superadmin
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Sinkronisasi sumber</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Impor manifest bertahap, periksa diff, lalu aktifkan snapshot secara
            atomik. Snapshot arsip dapat diaktifkan kembali sebagai rollback.
          </p>
        </div>
        <Link
          className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold"
          href="/admin"
        >
          Kembali ke superadmin
        </Link>
      </header>

      {message ? (
        <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <h2 className="font-serif text-2xl font-bold">Impor manual</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          File harus mengikuti format pada dokumentasi repository. Data divalidasi
          sebelum dikirim dalam batch 250 item.
        </p>
        <div className="mt-6">
          <SourceImporter />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl font-bold">Riwayat snapshot</h2>
        <div className="mt-5 grid gap-5">
          {snapshots.map((snapshot) => (
            <article
              className="rounded-3xl border border-border bg-surface p-6"
              key={snapshot.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">{snapshot.sourceVersion}</h3>
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                      {snapshot.status}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {snapshot.sourceCommit ?? 'tanpa commit'} ·{' '}
                    {snapshot.checksum.slice(0, 16)}…
                  </p>
                </div>
                {snapshot.status === 'validated' || snapshot.status === 'archived' ? (
                  <form action={activateSourceSnapshot}>
                    <input name="snapshot_id" type="hidden" value={snapshot.id} />
                    <label className="mb-3 flex max-w-xs items-start gap-2 text-xs text-muted-foreground">
                      <input
                        className="mt-1"
                        name="confirmed"
                        required
                        type="checkbox"
                        value="yes"
                      />
                      Saya sudah memeriksa diff dan memahami perubahan katalog.
                    </label>
                    <button
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                      type="submit"
                    >
                      {snapshot.status === 'archived'
                        ? 'Rollback ke snapshot ini'
                        : 'Aktifkan snapshot'}
                    </button>
                  </form>
                ) : null}
              </div>
              {snapshot.diff ? (
                <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6">
                  {[
                    ['Total', snapshot.diff.total],
                    ['Added', snapshot.diff.added],
                    ['Changed', snapshot.diff.changed],
                    ['Moved', snapshot.diff.moved_level],
                    ['Removed', snapshot.diff.removed],
                    ['Unchanged', snapshot.diff.unchanged],
                  ].map(([label, value]) => (
                    <div className="rounded-xl bg-background p-3" key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
