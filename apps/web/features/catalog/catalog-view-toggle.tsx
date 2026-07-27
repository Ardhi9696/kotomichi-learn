import Link from 'next/link';

import type { CatalogQuery, CatalogViewMode } from '@/features/catalog/types';

const viewLabels = {
  grid: 'Tampilan grid',
  list: 'Tampilan list',
} as const;

function viewHref(query: CatalogQuery, view: CatalogViewMode): string {
  const params = new URLSearchParams({
    level: query.level,
    type: query.type,
    view,
    page: String(query.page),
  });
  if (query.search) params.set('q', query.search);
  if (query.partOfSpeech !== 'all') params.set('pos', query.partOfSpeech);
  if (query.verbGroup !== 'all') params.set('verb', query.verbGroup);
  if (query.transitivity !== 'all') params.set('transitivity', query.transitivity);
  if (query.adjectiveType !== 'all') params.set('adjective', query.adjectiveType);
  if (query.theme !== 'all') params.set('theme', query.theme);
  return `/catalog?${params.toString()}`;
}

function ViewIcon({ view }: { view: CatalogViewMode }) {
  if (view === 'list') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
        <path d="M2 3h2v2H2V3Zm4 0h8v2H6V3ZM2 7h2v2H2V7Zm4 0h8v2H6V7ZM2 11h2v2H2v-2Zm4 0h8v2H6v-2Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M2 2h5v5H2V2Zm7 0h5v5H9V2ZM2 9h5v5H2V9Zm7 0h5v5H9V9Z" fill="currentColor" />
    </svg>
  );
}

export function CatalogViewToggle({ query }: { query: CatalogQuery }) {
  return (
    <nav
      aria-label="Mode tampilan katalog"
      className="inline-flex rounded-xl border border-border bg-surface p-1"
    >
      {(['grid', 'list'] as const).map((view) => {
        const active = query.view === view;
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            aria-label={viewLabels[view]}
            className={`inline-flex size-10 items-center justify-center rounded-lg transition focus-visible:outline-2 ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-primary-soft hover:text-primary'
            }`}
            href={viewHref(query, view)}
            key={view}
          >
            <ViewIcon view={view} />
          </Link>
        );
      })}
    </nav>
  );
}
