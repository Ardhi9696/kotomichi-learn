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

    </form>
  );
}
