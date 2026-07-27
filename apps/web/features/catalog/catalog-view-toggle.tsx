'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

import type { CatalogQuery, CatalogViewMode } from '@/features/catalog/types';

const viewLabels = {
  grid: 'Tampilan grid',
  list: 'Tampilan list',
} as const;

export function CatalogViewToggle({ query }: { query: CatalogQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchView = useCallback(
    (view: CatalogViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  return (
    <nav
      aria-label="Mode tampilan katalog"
      className="inline-flex rounded-xl border border-border bg-surface p-1"
    >
      {(['grid', 'list'] as const).map((view) => {
        const active = query.view === view;
        return (
          <button
            aria-current={active ? 'page' : undefined}
            aria-label={viewLabels[view]}
            className={`inline-flex size-10 items-center justify-center rounded-lg transition focus-visible:outline-2 ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-primary-soft hover:text-primary'
            }`}
            key={view}
            onClick={() => switchView(view)}
            type="button"
          >
            <ViewIcon view={view} />
          </button>
        );
      })}
    </nav>
  );
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
