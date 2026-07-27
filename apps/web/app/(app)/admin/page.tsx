import type { Metadata } from 'next';
import Link from 'next/link';

import { assignUserRole, removeUserRole } from '@/features/admin/actions';
import { getAdminDashboardData } from '@/features/admin/queries';
import { MANAGEABLE_ROLES } from '@/features/admin/role-schema';

export const metadata: Metadata = {
  title: 'Superadmin',
};

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [data, params] = await Promise.all([getAdminDashboardData(), searchParams]);
  const message = firstParam(params.message);
  const error = firstParam(params.error);

  const stats = [
    ['Materi aktif', data.activeContentCount.toLocaleString('id-ID')],
    ['Laporan terbuka', data.openReportCount.toLocaleString('id-ID')],
    ['Terjemahan terbit', data.publishedTranslationCount.toLocaleString('id-ID')],
    ['Snapshot aktif', data.activeSnapshotVersion ?? 'Belum ada'],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Kontrol internal
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Superadmin
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pantau konten dan kelola akses tim editorial.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-primary bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            href="/admin/sources"
          >
            Sinkronisasi sumber
          </Link>
          <Link
            className="rounded-full border border-primary bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            href="/reports"
          >
            Triase laporan
          </Link>
          <Link
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            href="/dashboard"
          >
            Kembali ke dashboard
          </Link>
        </div>
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

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <article className="rounded-2xl border border-border bg-surface p-6" key={label}>
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-4 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <h2 className="font-serif text-2xl font-bold">Tambahkan role</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pengguna harus sudah mendaftar sebelum role dapat diberikan.
          </p>
          <form action={assignUserRole} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold" htmlFor="email">
              Email pengguna
            </label>
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              id="email"
              name="email"
              placeholder="nama@example.com"
              required
              type="email"
            />
            <label className="block text-sm font-semibold" htmlFor="role">
              Role
            </label>
            <select
              className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
              id="role"
              name="role"
            >
              {MANAGEABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              className="w-full rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
              type="submit"
            >
              Tambahkan role
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <h2 className="font-serif text-2xl font-bold">Pemegang role</h2>
          {data.roleAssignments.length ? (
            <ul className="mt-6 divide-y divide-border">
              {data.roleAssignments.map((assignment) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                  key={`${assignment.userId}-${assignment.role}`}
                >
                  <div>
                    <p className="font-semibold">{assignment.displayName}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {assignment.userId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                      {assignment.role}
                    </span>
                    {assignment.role !== 'superadmin' ? (
                      <form action={removeUserRole}>
                        <input name="user_id" type="hidden" value={assignment.userId} />
                        <input name="role" type="hidden" value={assignment.role} />
                        <button
                          className="text-sm font-semibold text-danger-foreground hover:underline"
                          type="submit"
                        >
                          Hapus
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Belum ada role yang diberikan.</p>
          )}
        </section>
      </div>
    </main>
  );
}
