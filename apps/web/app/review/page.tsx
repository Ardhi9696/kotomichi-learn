import type { Metadata } from 'next';

import { SubmitButton } from '@/components/auth/submit-button';
import { createReviewSession } from '@/features/learning/actions';
import { getReviewQueueData } from '@/features/learning/queries';

export const metadata: Metadata = {
  title: 'Antrean review',
};

const typeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

type ReviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const data = await getReviewQueueData();
  const params = await searchParams;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const itemCountOptions =
    data.dueItems.length < 5
      ? [data.dueItems.length]
      : [5, 10, 20, 30].filter((count) => count <= data.dueItems.length);
  const defaultItemCount =
    itemCountOptions.findLast((count) => count <= 10) ?? itemCountOptions[0];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <header>
        <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
          Review {data.targetLevel}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
          Ingat kembali sebelum terlupa.
        </h1>
        <p className="mt-4 text-muted-foreground">
          {data.dueItems.length} materi sedang jatuh tempo. Materi paling lama menunggu
          diprioritaskan lebih dulu.
        </p>
      </header>

      {message ? (
        <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}

      {data.dueItems.length ? (
        <>
          <form action={createReviewSession} className="mt-8 flex flex-wrap items-end gap-3">
            <label className="grid gap-1.5 text-sm font-semibold">
              Jumlah review
              <select
                className="h-12 rounded-xl border border-border bg-surface px-4"
                defaultValue={defaultItemCount}
                name="item_count"
              >
                {itemCountOptions.map((count) => (
                  <option key={count} value={count}>
                    {count} item
                  </option>
                ))}
              </select>
            </label>
            <div className="w-full max-w-xs">
              <SubmitButton pendingLabel="Menyiapkan review…">Mulai review</SubmitButton>
            </div>
          </form>

          <ol className="mt-8 grid gap-3">
            {data.dueItems.map((item, index) => (
              <li
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
                key={item.id}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[item.type]}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <section className="mt-9 rounded-3xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-serif text-2xl font-bold">Semua review sudah selesai</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kembali lagi saat jadwal berikutnya jatuh tempo.
          </p>
        </section>
      )}
    </div>
  );
}
