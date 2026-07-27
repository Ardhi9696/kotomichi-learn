import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import type { CatalogQuery } from '@/features/catalog/types';

function pageHref(query: CatalogQuery, page: number): string {
  const params = new URLSearchParams({
    level: query.level,
    type: query.type,
    page: String(page),
  });
  if (query.search) params.set('q', query.search);
  return `/catalog?${params.toString()}`;
}

export function Pagination({
  query,
  totalPages,
}: {
  query: CatalogQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginasi katalog"
      className="mt-12 flex items-center justify-between border-t border-border pt-6"
    >
      {query.page > 1 ? (
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"
          href={pageHref(query, query.page - 1)}
        >
          <ArrowIcon direction="left" />
          Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">
        Halaman <strong className="text-foreground">{query.page}</strong> dari {totalPages}
      </span>
      {query.page < totalPages ? (
        <Link
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"
          href={pageHref(query, query.page + 1)}
        >
          Berikutnya
          <ArrowIcon />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
