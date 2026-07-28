'use client';

import { useState } from 'react';

import type { ContentDetail } from '@/features/catalog/types';

const ratings = [
  { value: 'forgot', label: 'Lupa', note: 'Belum berhasil' },
  { value: 'hard', label: 'Sulit', note: 'Berhasil dengan susah payah' },
  { value: 'good', label: 'Bagus', note: 'Berhasil' },
  { value: 'easy', label: 'Mudah', note: 'Berhasil dengan mudah' },
] as const;

export function ProductionCard({
  detail,
  onRate,
}: {
  detail: ContentDetail;
  onRate: (formData: FormData) => Promise<never>;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <article className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card">
      <header className="paper-grid px-6 py-12 text-center sm:px-10">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Production · Indonesia → Jepang
        </p>
        <h1 className="mt-6 font-serif text-4xl font-bold">
          {detail.meanings.join('; ')}
        </h1>
        {!revealed ? (
          <button
            className="mt-9 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
            onClick={() => setRevealed(true)}
            type="button"
          >
            Buka jawaban
          </button>
        ) : null}
      </header>

      {revealed ? (
        <section className="border-t border-border p-6 text-center sm:p-10">
          <p className="font-serif text-5xl font-bold" lang="ja">{detail.title}</p>
          {detail.reading ? (
            <p className="mt-2 text-lg text-muted-foreground" lang="ja">{detail.reading}</p>
          ) : null}
          {detail.supportingText ? (
            <p className="mt-4 text-sm text-muted-foreground">{detail.supportingText}</p>
          ) : null}
          <form action={onRate} className="mt-8 grid gap-3 sm:grid-cols-4">
            {ratings.map((rating) => (
              <button
                className="rounded-xl border border-border bg-background px-3 py-4 font-bold hover:border-primary hover:text-primary"
                key={rating.value}
                name="rating"
                type="submit"
                value={rating.value}
              >
                {rating.label}
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {rating.note}
                </span>
              </button>
            ))}
          </form>
        </section>
      ) : null}
    </article>
  );
}
