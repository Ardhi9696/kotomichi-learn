import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import { getContentDetail } from '@/features/catalog/queries';
import { isLocale } from '@/features/catalog/types';

type DetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const typeLabels = {
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  grammar: 'Grammar',
} as const;

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Materi ${id.slice(0, 8)}`,
  };
}

export default async function ContentDetailPage({
  params,
  searchParams,
}: DetailPageProps) {
  const { id } = await params;
  const rawLocale = await searchParams;
  const localeValue = Array.isArray(rawLocale.locale)
    ? rawLocale.locale[0]
    : rawLocale.locale;
  const locale = isLocale(localeValue) ? localeValue : 'id';
  const detail = await getContentDetail(id, locale);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
        href={`/catalog?level=${detail.level}&type=${detail.type}`}
      >
        <ArrowIcon direction="left" />
        Kembali ke {detail.level}
      </Link>

      <article className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card">
        <header className="paper-grid relative border-b border-border px-6 py-10 sm:px-10 sm:py-14">
          <div className="absolute top-0 right-0 h-full w-2 bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
              {detail.level}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
              {typeLabels[detail.type]}
            </span>
            {detail.isFallback ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                Terjemahan Inggris
              </span>
            ) : null}
          </div>
          <h1
            className={
              detail.type === 'kanji'
                ? 'mt-7 font-serif text-8xl leading-none font-bold'
                : 'mt-7 font-serif text-4xl leading-tight font-bold sm:text-6xl'
            }
          >
            {detail.title}
          </h1>
          {detail.reading ? (
            <p className="mt-3 text-lg font-medium text-muted-foreground">
              {detail.reading}
            </p>
          ) : null}
        </header>

        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <section>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Makna
              </p>
              <ul className="mt-4 grid gap-3">
                {detail.meanings.map((meaning) => (
                  <li
                    className="flex gap-3 rounded-xl border border-border bg-background px-4 py-3"
                    key={meaning}
                  >
                    <span aria-hidden="true" className="mt-2 size-1.5 rounded-full bg-primary" />
                    <span>{meaning}</span>
                  </li>
                ))}
              </ul>
            </section>

            {detail.examples.length ? (
              <section className="mt-10">
                <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                  Contoh kalimat
                </p>
                <div className="mt-4 grid gap-4">
                  {detail.examples.map((example) => (
                    <blockquote
                      className="rounded-2xl border-l-4 border-primary bg-background p-5"
                      key={`${example.ja}-${example.en}`}
                    >
                      <p lang="ja" className="text-lg leading-8 font-medium">
                        {example.ja}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{example.en}</p>
                    </blockquote>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="rounded-2xl bg-foreground p-6 text-background">
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
              Catatan materi
            </p>
            {detail.type === 'kanji' ? (
              <dl className="mt-5 grid gap-5 text-sm">
                <div>
                  <dt className="text-background/55">On&apos;yomi</dt>
                  <dd className="mt-1 font-medium">{detail.onyomi.join(' · ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-background/55">Kun&apos;yomi</dt>
                  <dd className="mt-1 font-medium">{detail.kunyomi.join(' · ') || '—'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-5">
                  <div>
                    <dt className="text-background/55">Strokes</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.strokes ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-background/55">Grade</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.grade ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-background/55">Freq.</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.frequency ?? '—'}</dd>
                  </div>
                </div>
              </dl>
            ) : null}

            {detail.type === 'grammar' ? (
              <div className="mt-5 grid gap-5 text-sm">
                <div>
                  <p className="text-background/55">Formation</p>
                  <p className="mt-1 font-medium">{detail.formation || '—'}</p>
                </div>
                {detail.notes ? (
                  <div>
                    <p className="text-background/55">Notes</p>
                    <p className="mt-1 font-medium">{detail.notes}</p>
                  </div>
                ) : null}
                {detail.tags.length ? (
                  <div className="flex flex-wrap gap-2 border-t border-white/15 pt-5">
                    {detail.tags.map((tag) => (
                      <span
                        className="rounded-full border border-white/20 px-3 py-1 text-xs"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {detail.type === 'vocabulary' ? (
              <p className="mt-5 text-sm leading-7 text-background/70">
                Materi ini berasal dari snapshot OpenJLPT aktif. Progres belajar nantinya
                terikat pada identitas kata, bukan bahasa terjemahan.
              </p>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  );
}
