import type { Metadata } from 'next';
import Link from 'next/link';

import { SubmitButton } from '@/components/auth/submit-button';
import { updateContentReport } from '@/features/reports/actions';
import { getEditorialReports, type ReportFilter } from '@/features/reports/queries';
import {
  REPORT_STATUSES,
  reportFieldLabels,
  reportStatusLabels,
} from '@/features/reports/report-schema';

export const metadata: Metadata = {
  title: 'Laporan materi',
};

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function reportTitle(report: Awaited<ReturnType<typeof getEditorialReports>>['reports'][number]) {
  const item = report.content_items;
  return item.word ?? item.character ?? item.pattern ?? item.id.slice(0, 8);
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const rawStatus = firstParam(params.status);
  const matchedStatus = REPORT_STATUSES.find((value) => value === rawStatus);
  const status: ReportFilter = rawStatus === 'all' ? 'all' : (matchedStatus ?? 'open');
  const { reports, canManageReports } = await getEditorialReports(status);
  const message = firstParam(params.message);
  const error = firstParam(params.error);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Kualitas materi
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Laporan pengguna
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tinjau masukan pengguna dan catat hasil penyelesaiannya.
          </p>
        </div>
        <Link
          className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"
          href="/dashboard"
        >
          Kembali ke dashboard
        </Link>
      </header>

      {message ? (
        <div className="mt-6 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground" role="status">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground" role="alert">
          {error}
        </div>
      ) : null}

      <nav aria-label="Filter status laporan" className="mt-8 flex flex-wrap gap-2">
        {(['open', 'triaged', 'resolved', 'rejected', 'all'] as const).map((value) => (
          <Link
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-surface text-muted-foreground hover:text-primary'
            }`}
            href={`/reports?status=${value}`}
            key={value}
          >
            {value === 'all' ? 'Semua' : reportStatusLabels[value]}
          </Link>
        ))}
      </nav>

      {reports.length ? (
        <div className="mt-6 grid gap-5">
          {reports.map((report) => (
            <article
              className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8"
              key={report.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                      {reportStatusLabels[report.status]}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {report.content_items.level} · {report.content_items.content_type}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-bold">
                    {reportTitle(report)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reportFieldLabels[report.field_name as keyof typeof reportFieldLabels]} ·{' '}
                    {new Intl.DateTimeFormat('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(report.created_at))}
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-primary hover:underline"
                  href={`/catalog/${report.content_items.id}?locale=${report.locale}`}
                >
                  Buka materi
                </Link>
              </div>

              <blockquote className="mt-5 rounded-2xl bg-background p-5 text-sm leading-7">
                {report.message}
              </blockquote>

              {canManageReports ? (
                <form action={updateContentReport} className="mt-6 grid gap-4 lg:grid-cols-[.35fr_1fr_auto] lg:items-end">
                  <input name="report_id" type="hidden" value={report.id} />
                  <input name="current_filter" type="hidden" value={status} />
                  <label className="grid gap-2 text-sm font-semibold">
                    Status
                    <select
                      className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-primary"
                      defaultValue={report.status}
                      name="status"
                    >
                      {REPORT_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {reportStatusLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Catatan penyelesaian
                    <input
                      className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-primary"
                      defaultValue={report.resolution_notes ?? ''}
                      maxLength={1000}
                      name="resolution_notes"
                      placeholder="Wajib saat laporan selesai atau ditolak"
                    />
                  </label>
                  <SubmitButton pendingLabel="Menyimpan…">Simpan status</SubmitButton>
                </form>
              ) : (
                <p className="mt-5 text-xs text-muted-foreground">
                  Role editor memiliki akses baca. Triase memerlukan reviewer atau admin.
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-serif text-2xl font-bold">Tidak ada laporan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Belum ada laporan dengan status yang dipilih.
          </p>
        </div>
      )}
    </main>
  );
}
