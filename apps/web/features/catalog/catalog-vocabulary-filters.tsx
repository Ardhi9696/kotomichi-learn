'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  VOCABULARY_ADJECTIVE_TYPES,
  VOCABULARY_PARTS_OF_SPEECH,
  VOCABULARY_THEMES,
  VOCABULARY_TRANSITIVITIES,
  VOCABULARY_VERB_GROUPS,
  type CatalogQuery,
} from '@/features/catalog/types';
import {
  adjectiveTypeLabels,
  partOfSpeechLabels,
  themeLabels,
  transitivityLabels,
  verbGroupLabels,
} from '@/features/catalog/vocabulary-taxonomy';

function activeFilterCount(query: CatalogQuery): number {
  return [
    query.partOfSpeech,
    query.verbGroup,
    query.transitivity,
    query.adjectiveType,
    query.theme,
  ].filter((v) => v !== 'all').length;
}

export function CatalogVocabularyFiltersPopover({ query }: { query: CatalogQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') params.set(key, value);
        else params.delete(key);
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  const count = activeFilterCount(query);

  return (
    <div className="relative">
      <button
        className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:border-primary/40 hover:text-primary focus-visible:outline-2"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
          <path
            d="M2 3h12M4.5 8h7M6.5 13h3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
        Filter
        {count > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 z-20 mt-2 grid w-[min(42rem,calc(100vw-2.5rem))] gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:right-0 sm:left-auto sm:grid-cols-2">
            <FilterSelect
              label="Kelas kata"
              options={VOCABULARY_PARTS_OF_SPEECH.map((v) => ({
                value: v,
                label: partOfSpeechLabels[v],
              }))}
              value={query.partOfSpeech}
              onChange={(val) => navigate({ pos: val })}
            />
            <FilterSelect
              label="Kelompok verba"
              options={VOCABULARY_VERB_GROUPS.map((v) => ({
                value: v,
                label: verbGroupLabels[v],
              }))}
              value={query.verbGroup}
              onChange={(val) => navigate({ verb: val })}
            />
            <FilterSelect
              label="Transitivitas"
              options={VOCABULARY_TRANSITIVITIES.map((v) => ({
                value: v,
                label: transitivityLabels[v],
              }))}
              value={query.transitivity}
              onChange={(val) => navigate({ transitivity: val })}
            />
            <FilterSelect
              label="Jenis adjektiva"
              options={VOCABULARY_ADJECTIVE_TYPES.map((v) => ({
                value: v,
                label: adjectiveTypeLabels[v],
              }))}
              value={query.adjectiveType}
              onChange={(val) => navigate({ adjective: val })}
            />
            <FilterSelect
              label="Tema"
              options={VOCABULARY_THEMES.map((v) => ({
                value: v,
                label: themeLabels[v],
              }))}
              value={query.theme}
              onChange={(val) => navigate({ theme: val })}
            />
            <div className="flex items-end gap-2 sm:justify-end sm:col-start-2">
              {count > 0 ? (
                <button
                  className="grid h-11 place-items-center rounded-xl border border-border px-4 text-sm font-semibold hover:text-primary"
                  onClick={() => {
                    navigate({
                      pos: 'all',
                      verb: 'all',
                      transitivity: 'all',
                      adjective: 'all',
                      theme: 'all',
                    });
                    setOpen(false);
                  }}
                  type="button"
                >
                  Reset
                </button>
              ) : null}
              <button
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                onClick={() => setOpen(false)}
                type="button"
              >
                Tutup
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterSelect({
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
    <label className="grid gap-1.5 text-xs font-semibold">
      {label}
      <select
        className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-sm font-normal focus:border-primary focus:outline-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">Semua</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
