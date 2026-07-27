import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';
import { SubmitButton } from '@/components/auth/submit-button';
import { getContentDetail } from '@/features/catalog/queries';
import { isLocale } from '@/features/catalog/types';
import {
  adjectiveTypeLabels,
  partOfSpeechLabels,
  themeLabels,
  transitivityLabels,
  verbGroupLabels,
} from '@/features/catalog/vocabulary-taxonomy';
import { createContentReport } from '@/features/reports/actions';
import {
  REPORT_FIELDS,
  reportFieldLabels,
} from '@/features/reports/report-schema';
import { createClient } from '@/lib/supabase/server';

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
  const rawSearchParams = await searchParams;
  const localeValue = Array.isArray(rawSearchParams.locale)
    ? rawSearchParams.locale[0]
    : rawSearchParams.locale;
  const locale = isLocale(localeValue) ? localeValue : 'id';
  const [detail, supabase] = await Promise.all([getContentDetail(id, locale), createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const message = Array.isArray(rawSearchParams.message)
    ? rawSearchParams.message[0]
    : rawSearchParams.message;
  const error = Array.isArray(rawSearchParams.error)
    ? rawSearchParams.error[0]
    : rawSearchParams.error;
  const returnPath = `/catalog/${id}?locale=${locale}#laporkan`;

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
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              {detail.level}
            </span>
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
              {typeLabels[detail.type]}
            </span>
            {detail.isFallback ? (
              <span className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning-foreground">
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

          <aside className="rounded-2xl bg-inverse p-6 text-inverse-foreground">
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">
              Catatan materi
            </p>
            {detail.type === 'kanji' ? (
              <dl className="mt-5 grid gap-5 text-sm">
                <div>
                  <dt className="text-inverse-muted">On&apos;yomi</dt>
                  <dd className="mt-1 font-medium">{detail.onyomi.join(' · ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-inverse-muted">Kun&apos;yomi</dt>
                  <dd className="mt-1 font-medium">{detail.kunyomi.join(' · ') || '—'}</dd>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-inverse-border pt-5">
                  <div>
                    <dt className="text-inverse-muted">Strokes</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.strokes ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-inverse-muted">Grade</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.grade ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-inverse-muted">Freq.</dt>
                    <dd className="mt-1 text-lg font-bold">{detail.frequency ?? '—'}</dd>
                  </div>
                </div>
              </dl>
            ) : null}

            {detail.type === 'grammar' ? (
              <div className="mt-5 grid gap-5 text-sm">
                <div>
                  <p className="text-inverse-muted">Formation</p>
                  <p className="mt-1 font-medium">{detail.formation || '—'}</p>
                </div>
                {detail.notes ? (
                  <div>
                    <p className="text-inverse-muted">Notes</p>
                    <p className="mt-1 font-medium">{detail.notes}</p>
                  </div>
                ) : null}
                {detail.tags.length ? (
                  <div className="flex flex-wrap gap-2 border-t border-inverse-border pt-5">
                    {detail.tags.map((tag) => (
                      <span
                        className="rounded-full border border-inverse-border px-3 py-1 text-xs"
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
              <div className="mt-5 grid gap-5 text-sm">
                {detail.taxonomy && !detail.taxonomy.needsReview ? (
                  <>
                    <div>
                      <p className="text-inverse-muted">Kelas kata</p>
                      <p className="mt-1 font-medium">
                        {detail.taxonomy.partsOfSpeech
                          .map((value) => partOfSpeechLabels[value])
                          .join(' · ')}
                      </p>
                    </div>
                    {detail.taxonomy.verbGroups.length ? (
                      <div>
                        <p className="text-inverse-muted">Jenis kata kerja</p>
                        <p className="mt-1 font-medium">
                          {[
                            ...detail.taxonomy.verbGroups.map(
                              (value) => verbGroupLabels[value],
                            ),
                            ...detail.taxonomy.transitivities.map(
                              (value) => transitivityLabels[value],
                            ),
                          ].join(' · ')}
                        </p>
                      </div>
                    ) : null}
                    {detail.taxonomy.adjectiveTypes.length ? (
                      <div>
                        <p className="text-inverse-muted">Jenis kata sifat</p>
                        <p className="mt-1 font-medium">
                          {detail.taxonomy.adjectiveTypes
                            .map((value) => adjectiveTypeLabels[value])
                            .join(' · ')}
                        </p>
                      </div>
                    ) : null}
                    {detail.taxonomy.themes.length ? (
                      <div className="flex flex-wrap gap-2 border-t border-inverse-border pt-5">
                        {detail.taxonomy.themes.map((value) => (
                          <span
                            className="rounded-full border border-inverse-border px-3 py-1 text-xs"
                            key={value}
                          >
                            {themeLabels[value]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : detail.taxonomy?.needsReview ? (
                  <p className="leading-7 text-inverse-muted">
                    Klasifikasi sedang menunggu review editorial.
                  </p>
                ) : (
                  <p className="leading-7 text-inverse-muted">
                    Klasifikasi kosakata ini belum tersedia.
                  </p>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </article>

      <section
        className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8"
        id="laporkan"
      >
        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
          Bantu jaga kualitas
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold">Laporkan masalah materi</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Beri tahu kami jika ada makna, cara baca, contoh, atau metadata yang perlu
          diperiksa.
        </p>

        {message ? (
          <div className="mt-5 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground" role="status">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground" role="alert">
            {error}
          </div>
        ) : null}

        {user ? (
          <form action={createContentReport} className="mt-6 grid gap-5">
            <input name="content_item_id" type="hidden" value={id} />
            <input name="locale" type="hidden" value={locale} />
            <label className="grid gap-2 text-sm font-semibold">
              Bagian yang bermasalah
              <select
                className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-primary"
                name="field_name"
              >
                {REPORT_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {reportFieldLabels[field]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Penjelasan
              <textarea
                className="min-h-32 rounded-xl border border-border bg-background px-4 py-3 font-normal leading-6 outline-none focus:border-primary"
                maxLength={1000}
                minLength={10}
                name="message"
                placeholder="Jelaskan bagian yang perlu diperiksa dan koreksi yang disarankan."
                required
              />
            </label>
            <div>
              <SubmitButton pendingLabel="Mengirim laporan…">Kirim laporan</SubmitButton>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-background p-5">
            <p className="text-sm text-muted-foreground">
              Masuk terlebih dahulu agar laporan dapat ditindaklanjuti.
            </p>
            <Link
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              href={`/auth/login?next=${encodeURIComponent(returnPath)}`}
            >
              Masuk untuk melapor
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
