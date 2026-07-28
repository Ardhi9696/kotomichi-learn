'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { ArrowIcon } from '@/components/arrow-icon';
import { PAGE_SIZES, type CatalogQuery, type PageSize } from '@/features/catalog/types';

function pageHref(query: CatalogQuery, page: number): string {
  const params = new URLSearchParams({
    level: query.level,
    type: query.type,
    view: query.view,
    page: String(page),
  });
  if (query.pageSize !== 25) params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('q', query.search);
  if (query.partOfSpeech !== 'all') params.set('pos', query.partOfSpeech);
  if (query.verbGroup !== 'all') params.set('verb', query.verbGroup);
  if (query.transitivity !== 'all') params.set('transitivity', query.transitivity);
  if (query.adjectiveType !== 'all') params.set('adjective', query.adjectiveType);
  if (query.theme !== 'all') params.set('theme', query.theme);
  return `/catalog?${params.toString()}`;
}

/** Build an array of page numbers to display, with -1 as ellipsis placeholder */
function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [];
  pages.push(1);

  if (current > 3) pages.push(-1);

  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

  if (current < total - 2) pages.push(-1);

  pages.push(total);
  return pages;
}

function PageSizeSelector({ query }: { query: CatalogQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changePageSize = useCallback(
    (newSize: PageSize) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSize !== 25) params.set('pageSize', String(newSize));
      else params.delete('pageSize');
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">Tampilkan</span>
      <select
        aria-label="Jumlah item per halaman"
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm font-medium focus:border-primary focus:outline-2"
        value={query.pageSize}
        onChange={(e) => changePageSize(Number(e.target.value) as PageSize)}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="hidden sm:inline">per halaman</span>
    </div>
  );
}

export function Pagination({
  query,
  totalPages,
}: {
  query: CatalogQuery;
  totalPages: number;
}) {
  const pages = getPageNumbers(query.page, totalPages);

  return (
    <nav
      aria-label="Paginasi katalog"
      className="mt-12 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Page size selector — always visible */}
      <PageSizeSelector query={query} />

      {/* Page navigation — only when more than 1 page */}
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          {/* Previous button */}
          {query.page > 1 ? (
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
              href={pageHref(query, query.page - 1)}
            >
              <ArrowIcon direction="left" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold opacity-40 cursor-not-allowed">
              <ArrowIcon direction="left" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </span>
          )}

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === -1 ? (
              <span
                key={`ellipsis-${i}`}
                className="inline-flex size-9 items-center justify-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : p === query.page ? (
              <span
                key={p}
                className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium transition hover:border-primary/40 hover:text-primary"
                href={pageHref(query, p)}
              >
                {p}
              </Link>
            ),
          )}

          {/* Next button */}
          {query.page < totalPages ? (
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
              href={pageHref(query, query.page + 1)}
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ArrowIcon />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold opacity-40 cursor-not-allowed">
              <span className="hidden sm:inline">Berikutnya</span>
              <ArrowIcon />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
