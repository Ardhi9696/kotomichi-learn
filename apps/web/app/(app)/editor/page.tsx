import type { Metadata } from 'next';
import Link from 'next/link';

import { setContentActive } from '@/features/editor/actions';
import { getEditorCatalog } from '@/features/editor/queries';
import {
  CONTENT_TYPES,
  isCatalogType,
  isLevel,
  LEVELS,
  type ContentType,
} from '@/features/catalog/types';

export const metadata: Metadata = {
  title: 'Editor materi',
};

type EditorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const params = await searchParams;
  const rawLevel = first(params.level);
  const rawType = first(params.type);
  const level = isLevel(rawLevel) ? rawLevel : 'N5';
  const type = isCatalogType(rawType) ? rawType : 'all';
  const search = first(params.q)?.trim() ?? '';
  const includeArchived = first(params.archived) === '1';
  const items = await getEditorCatalog({ level, type, search, includeArchived });
  const message = first(params.message);
  const error = first(params.error);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Editorial workspace
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Kelola materi
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tambah, baca, ubah, arsipkan, dan pulihkan seluruh materi.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            href="/editor/new"
          >
            Tambah materi
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

      <form className="mt-8 grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[1fr_.35fr_.35fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-semibold">
          Cari materi
          <input
            className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-primary"
            defaultValue={search}
            name="q"
            placeholder="Kata, bacaan, karakter, atau pola"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Level
          <select
            className="rounded-xl border border-border bg-background px-4 py-3 font-normal"
            defaultValue={level}
            name="level"
          >
            {LEVELS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Jenis
          <select
            className="rounded-xl border border-border bg-background px-4 py-3 font-normal"
            defaultValue={type}
            name="type"
          >
            <option value="all">Semua</option>
            {CONTENT_TYPES.map((value: ContentType) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              defaultChecked={includeArchived}
              name="archived"
              type="checkbox"
              value="1"
            />
            Arsip
          </label>
          <button
            className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
            type="submit"
          >
            Terapkan
          </button>
        </div>
      </form>

      {items.length ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                className={`flex flex-wrap items-center justify-between gap-5 p-5 ${
                  item.isActive ? '' : 'bg-background/70 opacity-70'
                }`}
                key={item.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                      {item.level}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                      {item.type}
                    </span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                      {item.origin === 'editorial'
                        ? 'Editorial'
                        : item.hasOverride
                          ? 'OpenJLPT + override'
                          : 'OpenJLPT'}
                    </span>
                    {!item.isActive ? (
                      <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger-foreground">
                        Diarsipkan
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 truncate font-serif text-xl font-bold">{item.title}</p>
                  {item.reading ? (
                    <p className="text-sm text-muted-foreground">{item.reading}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                    href={`/editor/${item.id}`}
                  >
                    Edit
                  </Link>
                  <form action={setContentActive}>
                    <input name="content_item_id" type="hidden" value={item.id} />
                    <input
                      name="is_active"
                      type="hidden"
                      value={item.isActive ? 'false' : 'true'}
                    />
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        item.isActive
                          ? 'text-danger-foreground hover:bg-danger-soft'
                          : 'text-success-foreground hover:bg-success-soft'
                      }`}
                      type="submit"
                    >
                      {item.isActive ? 'Arsipkan' : 'Pulihkan'}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-serif text-2xl font-bold">Materi tidak ditemukan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ubah filter atau tambahkan materi editorial baru.
          </p>
        </div>
      )}
    </main>
  );
}
