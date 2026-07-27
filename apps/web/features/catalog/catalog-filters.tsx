import {
  CONTENT_TYPES,
  LEVELS,
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

const typeLabels = {
  all: 'Semua materi',
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

export function CatalogFilters({ query }: { query: CatalogQuery }) {
  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[0_10px_35px_rgb(46_37_32_/_4%)]"
      method="get"
    >
      <input name="view" type="hidden" value={query.view} />
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <label className="grid gap-1.5 text-sm font-semibold">
          Cari materi
          <input
            className="h-12 rounded-xl border border-border bg-background px-4 font-normal placeholder:text-muted-foreground/70 focus:border-primary focus:outline-2"
            defaultValue={query.search}
            maxLength={80}
            name="q"
            placeholder="食べる, たべる, makan, eat…"
            type="search"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          Level
          <select
            className="h-12 min-w-28 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            defaultValue={query.level}
            name="level"
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          Jenis
          <select
            className="h-12 min-w-40 rounded-xl border border-border bg-background px-4 font-normal focus:border-primary focus:outline-2"
            defaultValue={query.type}
            name="type"
          >
            <option value="all">{typeLabels.all}</option>
            {CONTENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <button
          className="h-12 rounded-xl bg-primary px-6 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2"
          type="submit"
        >
          Terapkan
        </button>
      </div>

      {query.type === 'vocabulary' ? (
        <fieldset className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <legend className="sr-only">Klasifikasi kosakata</legend>
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
        </fieldset>
      ) : null}
    </form>
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
