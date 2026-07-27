import type { Metadata } from 'next';

import { Suspense } from 'react';

import { CatalogCard } from '@/features/catalog/catalog-card';
import { CatalogToolbar } from '@/features/catalog/catalog-toolbar';
import { Pagination } from '@/features/catalog/pagination';
import { getCatalog } from '@/features/catalog/queries';
import {
  isCatalogType,
  isCatalogViewMode,
  isLevel,
  isVocabularyAdjectiveType,
  isVocabularyPartOfSpeech,
  isVocabularyTheme,
  isVocabularyTransitivity,
  isVocabularyVerbGroup,
  type CatalogQuery,
} from '@/features/catalog/types';

export const metadata: Metadata = {
  title: 'Katalog materi',
  description: 'Jelajahi vocabulary, kanji, dan grammar OpenJLPT dari N5 hingga N1.',
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuery(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const level = first(searchParams.level);
  const type = first(searchParams.type);
  const rawPage = Number(first(searchParams.page) ?? '1');
  const view = first(searchParams.view);
  const partOfSpeech = first(searchParams.pos);
  const verbGroup = first(searchParams.verb);
  const transitivity = first(searchParams.transitivity);
  const adjectiveType = first(searchParams.adjective);
  const theme = first(searchParams.theme);

  return {
    level: isLevel(level) ? level : 'N5',
    type: isCatalogType(type) ? type : 'all',
    search: first(searchParams.q)?.trim() ?? '',
    view: isCatalogViewMode(view) ? view : 'list',
    partOfSpeech: isVocabularyPartOfSpeech(partOfSpeech) ? partOfSpeech : 'all',
    verbGroup: isVocabularyVerbGroup(verbGroup) ? verbGroup : 'all',
    transitivity: isVocabularyTransitivity(transitivity) ? transitivity : 'all',
    adjectiveType: isVocabularyAdjectiveType(adjectiveType)
      ? adjectiveType
      : 'all',
    theme: isVocabularyTheme(theme) ? theme : 'all',
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const query = parseQuery(await searchParams);
  const result = await getCatalog(query);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="grid gap-5 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
            Katalog OpenJLPT
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Pilih materi untuk langkah berikutnya.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Jelajahi materi kanonis dalam bahasa Inggris. Terjemahan Indonesia dan Korea
            akan muncul otomatis setelah melewati proses review.
          </p>
        </div>
      </header>

      <div className="mt-8">
        <Suspense fallback={<ToolbarSkeleton />}>
          <CatalogToolbar query={query} total={result.total} />
        </Suspense>
      </div>

      {result.items.length ? (
        <>
          <section
            aria-label="Daftar materi"
            className={
              query.view === 'list'
                ? 'mt-6 grid gap-3'
                : 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }
          >
            {result.items.map((item) => (
              <CatalogCard item={item} key={item.id} view={query.view} />
            ))}
          </section>
          <Pagination query={query} totalPages={result.totalPages} />
        </>
      ) : (
        <section className="mt-8 rounded-3xl border border-dashed border-border bg-surface px-6 py-20 text-center">
          <p className="font-serif text-2xl font-bold">Materi belum ditemukan</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Coba kata kunci lain atau ubah level dan jenis materi.
          </p>
        </section>
      )}
    </div>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="h-24 animate-pulse rounded-2xl bg-muted" />
  );
}
