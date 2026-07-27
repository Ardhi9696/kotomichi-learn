import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import type { CatalogItem } from '@/features/catalog/types';

const typeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

export function CatalogCard({ item }: { item: CatalogItem }) {
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

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="text-xs text-muted-foreground">{item.supportingText}</span>
        <Link
          aria-label={`Lihat detail ${item.title}`}
          className="inline-flex size-10 items-center justify-center rounded-full border border-border text-primary transition group-hover:border-primary group-hover:bg-primary group-hover:text-white focus-visible:outline-2"
          href={`/catalog/${item.id}`}
        >
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}
