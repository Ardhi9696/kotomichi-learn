import type { Metadata } from 'next';
import Link from 'next/link';

import {
  CONTENT_TYPES,
  isCatalogType,
  isLevel,
  LEVELS,
} from '@/features/catalog/types';
import {
  getTranslationWorkspace,
  type TranslationListStatus,
  type TranslationLocale,
} from '@/features/translations/queries';

export const metadata: Metadata = { title: 'Translation workspace' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_OPTIONS: TranslationListStatus[] = [
  'all',
  'missing',
  'draft',
  'submitted',
  'reviewed',
  'published',
  'needs_review',
];

export default async function TranslationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawLevel = first(params.level);
  const rawType = first(params.type);
  const level = isLevel(rawLevel) ? rawLevel : 'N5';
  const type = isCatalogType(rawType) ? rawType : 'all';
  const locale: TranslationLocale = first(params.locale) === 'ko' ? 'ko' : 'id';
  const rawStatus = first(params.status);
  const status =
    STATUS_OPTIONS.find((option) => option === rawStatus) ?? ('all' as const);
  const search = first(params.q)?.trim() ?? '';
  const { items, coverage } = await getTranslationWorkspace({
    level,
    type,
    locale,
    status,
    search,
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Localization
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            Translation workspace
          </h1>
          <p className="mt-3 text-muted-foreground">
            Draft, review, dan publish translation Indonesia atau Korea.
          </p>
        </div>
        <Link className="text-sm font-semibold text-primary hover:underline" href="/editor">
          Kelola materi →
        </Link>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {coverage.map((item) => (
          <article className="rounded-2xl border border-border bg-surface p-5" key={item.contentType}>
            <p className="text-xs font-bold text-muted-foreground uppercase">
              {item.contentType}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {item.published}/{item.total}
            </p>
            <p className="text-xs text-muted-foreground">translation published</p>
          </article>
        ))}
      </section>

      <form className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-5">
        <input className="rounded-xl border border-border bg-background px-4 py-3" defaultValue={search} name="q" placeholder="Cari materi" />
        <select className="rounded-xl border border-border bg-background px-4 py-3" defaultValue={level} name="level">
          {LEVELS.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className="rounded-xl border border-border bg-background px-4 py-3" defaultValue={type} name="type">
          <option value="all">Semua jenis</option>
          {CONTENT_TYPES.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className="rounded-xl border border-border bg-background px-4 py-3" defaultValue={locale} name="locale">
          <option value="id">Indonesia</option>
          <option value="ko">Korea</option>
        </select>
        <div className="flex gap-2">
          <select className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-3" defaultValue={status} name="status">
            {STATUS_OPTIONS.map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background" type="submit">Filter</button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        {items.length ? (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li className="flex flex-wrap items-center justify-between gap-4 p-5" key={item.id}>
                <div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">{item.level}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">{item.type}</span>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                      {item.isSubmitted ? 'submitted' : item.translationStatus}
                    </span>
                  </div>
                  <p className="mt-3 font-serif text-xl font-bold">{item.title}</p>
                </div>
                <Link className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary" href={`/translations/${item.id}?locale=${locale}`}>
                  Buka translation
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-muted-foreground">Tidak ada materi untuk filter ini.</p>
        )}
      </div>
    </main>
  );
}
