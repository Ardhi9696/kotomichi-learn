import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import type { CatalogItem, CatalogViewMode } from '@/features/catalog/types';
import {
  adjectiveTypeLabels,
  partOfSpeechLabels,
  themeLabels,
} from '@/features/catalog/vocabulary-taxonomy';

const typeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

function DetailLink({ item }: { item: CatalogItem }) {
  return (
    <Link
      aria-label={`Lihat detail ${item.title}`}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground focus-visible:outline-2"
      href={`/catalog/${item.id}`}
    >
      <ArrowIcon />
    </Link>
  );
}

function TaxonomyBadges({ item }: { item: CatalogItem }) {
  if (!item.taxonomy || item.taxonomy.needsReview) return null;
  const labels = [
    ...item.taxonomy.partsOfSpeech.map((value) => partOfSpeechLabels[value]),
    ...item.taxonomy.adjectiveTypes.map((value) => adjectiveTypeLabels[value]),
    ...item.taxonomy.themes.slice(0, 1).map((value) => themeLabels[value]),
  ];
  if (!labels.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
          key={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function CatalogCard({
  item,
  view = 'grid',
}: {
  item: CatalogItem;
  view?: CatalogViewMode;
}) {
  if (view === 'list') {
    return (
      <article className="group grid gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30 hover:shadow-card sm:grid-cols-[minmax(11rem,.7fr)_minmax(0,1.3fr)_auto] sm:items-center sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
              {item.level}
            </span>
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {typeLabels[item.type]}
            </span>
          </div>
          <h2 className="mt-2 truncate font-serif text-2xl leading-tight font-bold">
            {item.title}
          </h2>
          {item.reading ? (
            <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground">
              {item.reading}
            </p>
          ) : null}
          <TaxonomyBadges item={item} />
        </div>

        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.meanings.slice(0, 3).join(' · ') || 'Makna belum tersedia'}
          </p>
          {item.supportingText ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.supportingText}</p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <DetailLink item={item} />
        </div>
      </article>
    );
  }

  return (
    <article className="group flex min-h-64 flex-col rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-card">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          {item.level}
        </span>
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {typeLabels[item.type]}
        </span>
      </div>

      <div className="mt-6">
        <h2
          className={
            item.type === 'kanji'
              ? 'font-serif text-5xl leading-tight font-bold'
              : 'font-serif text-2xl leading-snug font-bold'
          }
        >
          {item.title}
        </h2>
        {item.reading ? (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{item.reading}</p>
        ) : null}
      </div>

      <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {item.meanings.slice(0, 3).join(' · ') || 'Makna belum tersedia'}
      </p>
      <TaxonomyBadges item={item} />

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="text-xs text-muted-foreground">{item.supportingText}</span>
        <DetailLink item={item} />
      </div>
    </article>
  );
}
