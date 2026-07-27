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

export function CatalogVocabularyFilters({ query }: { query: CatalogQuery }) {
  const activeCount = [
    query.partOfSpeech,
    query.verbGroup,
    query.transitivity,
    query.adjectiveType,
    query.theme,
  ].filter((value) => value !== 'all').length;

  return (
    <details className="group relative w-full sm:w-auto">
      <summary className="flex h-[50px] w-full cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold transition hover:border-primary/40 hover:text-primary focus-visible:outline-2 sm:w-auto">
        <FilterIcon />
        Filter vocabulary
        {activeCount ? (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </summary>
      <form
        className="absolute top-full left-0 z-20 mt-2 grid w-[min(42rem,calc(100vw-2.5rem))] gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:right-0 sm:left-auto sm:grid-cols-2"
        method="get"
      >
        <input name="level" type="hidden" value={query.level} />
        <input name="type" type="hidden" value="vocabulary" />
        <input name="view" type="hidden" value={query.view} />
        <input name="page" type="hidden" value="1" />
        {query.search ? <input name="q" type="hidden" value={query.search} /> : null}
        <TaxonomySelect
          label="Kelas kata"
          name="pos"
          options={VOCABULARY_PARTS_OF_SPEECH.map((value) => ({
            value,
            label: partOfSpeechLabels[value],
          }))}
          value={query.partOfSpeech}
        />
        <TaxonomySelect
          label="Kelompok verba"
          name="verb"
          options={VOCABULARY_VERB_GROUPS.map((value) => ({
            value,
            label: verbGroupLabels[value],
          }))}
          value={query.verbGroup}
        />
        <TaxonomySelect
          label="Transitivitas"
          name="transitivity"
          options={VOCABULARY_TRANSITIVITIES.map((value) => ({
            value,
            label: transitivityLabels[value],
          }))}
          value={query.transitivity}
        />
        <TaxonomySelect
          label="Jenis adjektiva"
          name="adjective"
          options={VOCABULARY_ADJECTIVE_TYPES.map((value) => ({
            value,
            label: adjectiveTypeLabels[value],
          }))}
          value={query.adjectiveType}
        />
        <TaxonomySelect
          label="Tema"
          name="theme"
          options={VOCABULARY_THEMES.map((value) => ({
            value,
            label: themeLabels[value],
          }))}
          value={query.theme}
        />
        <div className="flex items-end gap-2 sm:justify-end">
          <a
            className="grid h-11 place-items-center rounded-xl border border-border px-4 text-sm font-semibold hover:text-primary"
            href={`/catalog?level=${query.level}&type=vocabulary&view=${query.view}`}
          >
            Reset
          </a>
          <button
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            type="submit"
          >
            Terapkan
          </button>
        </div>
      </form>
    </details>
  );
}

function TaxonomySelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold">
      {label}
      <select
        className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-sm font-normal focus:border-primary focus:outline-2"
        defaultValue={value}
        name={name}
      >
        <option value="all">Semua</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M2 3h12M4.5 8h7M6.5 13h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
