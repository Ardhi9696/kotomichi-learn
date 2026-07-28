'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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

type FilterValues = {
  pos: string;
  verb: string;
  transitivity: string;
  adjective: string;
  theme: string;
};

function initialFilterValues(query: CatalogQuery): FilterValues {
  return {
    pos: query.partOfSpeech,
    verb: query.verbGroup,
    transitivity: query.transitivity,
    adjective: query.adjectiveType,
    theme: query.theme,
  };
}

function activeFilterCount(values: FilterValues): number {
  return Object.values(values).filter((v) => v !== 'all').length;
}

export function CatalogVocabularyFiltersPopover({ query }: { query: CatalogQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(() => initialFilterValues(query));
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync draft when query changes externally (e.g. URL navigation)
  useEffect(() => {
    setDraft(initialFilterValues(query));
  }, [query.partOfSpeech, query.verbGroup, query.transitivity, query.adjectiveType, query.theme]);

  const updateDraft = useCallback((key: keyof FilterValues, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(
    (values: FilterValues) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(values)) {
        if (value && value !== 'all') params.set(key, value);
        else params.delete(key);
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, searchParams, router],
  );

  const handleApply = useCallback(() => {
    applyFilters(draft);
    setOpen(false);
  }, [applyFilters, draft]);

  const handleReset = useCallback(() => {
    const resetValues: FilterValues = {
      pos: 'all',
      verb: 'all',
      transitivity: 'all',
      adjective: 'all',
      theme: 'all',
    };
    setDraft(resetValues);
    applyFilters(resetValues);
    setOpen(false);
  }, [applyFilters]);

  const handleClose = useCallback(() => {
    // Apply any pending changes before closing
    applyFilters(draft);
    setOpen(false);
  }, [applyFilters, draft]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  const count = activeFilterCount(draft);

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
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          {/* Centered modal panel */}
          <div
            ref={panelRef}
            className="fixed left-1/2 top-1/2 z-50 grid w-[min(42rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2"
          >
            <FilterSelect
              label="Kelas kata"
              options={VOCABULARY_PARTS_OF_SPEECH.map((v) => ({
                value: v,
                label: partOfSpeechLabels[v],
              }))}
              value={draft.pos}
              onChange={(val) => updateDraft('pos', val)}
            />
            <FilterSelect
              label="Kelompok verba"
              options={VOCABULARY_VERB_GROUPS.map((v) => ({
                value: v,
                label: verbGroupLabels[v],
              }))}
              value={draft.verb}
              onChange={(val) => updateDraft('verb', val)}
            />
            <FilterSelect
              label="Transitivitas"
              options={VOCABULARY_TRANSITIVITIES.map((v) => ({
                value: v,
                label: transitivityLabels[v],
              }))}
              value={draft.transitivity}
              onChange={(val) => updateDraft('transitivity', val)}
            />
            <FilterSelect
              label="Jenis adjektiva"
              options={VOCABULARY_ADJECTIVE_TYPES.map((v) => ({
                value: v,
                label: adjectiveTypeLabels[v],
              }))}
              value={draft.adjective}
              onChange={(val) => updateDraft('adjective', val)}
            />
            <FilterSelect
              label="Tema"
              options={VOCABULARY_THEMES.map((v) => ({
                value: v,
                label: themeLabels[v],
              }))}
              value={draft.theme}
              onChange={(val) => updateDraft('theme', val)}
            />
            <div className="flex items-end gap-2 sm:justify-end sm:col-start-2">
              {count > 0 ? (
                <button
                  className="grid h-11 place-items-center rounded-xl border border-border px-4 text-sm font-semibold hover:text-primary"
                  onClick={handleReset}
                  type="button"
                >
                  Reset
                </button>
              ) : null}
              <button
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                onClick={handleApply}
                type="button"
              >
                Terapkan
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
