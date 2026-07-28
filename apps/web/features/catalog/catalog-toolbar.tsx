'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

import { CatalogSearchInput } from '@/features/catalog/catalog-search-input';
import { CatalogViewToggle } from '@/features/catalog/catalog-view-toggle';
import { CatalogVocabularyFiltersPopover } from '@/features/catalog/catalog-vocabulary-filters';
import {
  CONTENT_TYPES,
  LEVELS,
  type CatalogQuery,
} from '@/features/catalog/types';

const typeLabels = {
  all: 'Semua materi',
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

function setParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaults: Record<string, string>,
) {
  if (value && value !== defaults[key]) params.set(key, value);
  else params.delete(key);
}

const DEFAULTS: Record<string, string> = {
  level: 'N5',
  type: 'all',
  view: 'list',
  page: '1',
  pageSize: '25',
};

export function CatalogToolbar({ query, total }: { query: CatalogQuery; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        setParam(params, key, value, DEFAULTS);
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_35px_rgb(46_37_32_/_4%)]">
      {/* Search — full width, debounced */}
      <CatalogSearchInput defaultValue={query.search} />

      {/* Level + type + count — inline row */}
      <div className="flex flex-wrap items-center gap-3">
        <CatalogSelect
          label="Level"
          options={LEVELS.map((l) => ({ value: l, label: l }))}
          value={query.level}
          onChange={(val) => navigate({ level: val })}
        />
        <CatalogSelect
          label="Jenis"
          options={[
            { value: 'all', label: typeLabels.all },
            ...CONTENT_TYPES.map((t) => ({ value: t, label: typeLabels[t] })),
          ]}
          value={query.type}
          onChange={(val) => navigate({ type: val })}
        />

        <span className="ml-auto text-xs text-muted-foreground">
          {total.toLocaleString('id-ID')} materi
        </span>
      </div>

      {/* Vocabulary filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {query.type === 'vocabulary' ? (
          <CatalogVocabularyFiltersPopover query={query} />
        ) : <span />}
        <CatalogViewToggle query={query} />
      </div>
    </div>
  );
}

function CatalogSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select
        className="h-10 min-w-28 rounded-xl border border-border bg-background px-3 text-sm font-normal focus:border-primary focus:outline-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
