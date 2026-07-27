import type { Metadata } from 'next';
import Link from 'next/link';

import { SubmitButton } from '@/components/auth/submit-button';
import {
  reviewTranslation,
  saveTranslationDraft,
  submitTranslationReview,
} from '@/features/translations/actions';
import {
  getTranslationEditor,
  type TranslationLocale,
} from '@/features/translations/queries';

export const metadata: Metadata = { title: 'Edit translation' };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TranslationEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const locale: TranslationLocale = first(query.locale) === 'ko' ? 'ko' : 'id';
  const data = await getTranslationEditor(id, locale);
  const message = first(query.message);
  const error = first(query.error);
  const commonInputs = (
    <>
      <input name="content_item_id" type="hidden" value={id} />
      <input name="content_type" type="hidden" value={data.source.type} />
      <input name="locale" type="hidden" value={locale} />
    </>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap justify-between gap-4">
        <Link className="text-sm font-semibold text-primary hover:underline" href={`/translations?locale=${locale}`}>
          ← Translation workspace
        </Link>
        <div className="flex gap-2">
          {(['id', 'ko'] as const).map((value) => (
            <Link className={`rounded-full px-4 py-2 text-sm font-semibold ${locale === value ? 'bg-primary text-primary-foreground' : 'border border-border'}`} href={`/translations/${id}?locale=${value}`} key={value}>
              {value.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      <header className="mt-6 border-b border-border pb-8">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          {data.source.level} · {data.source.type} · {locale.toUpperCase()}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold">{data.source.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: {data.translation.isSubmitted ? 'submitted' : data.translation.status}
        </p>
      </header>

      {message ? <div className="mt-6 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground">{message}</div> : null}
      {error ? <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground">{error}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="rounded-3xl bg-inverse p-6 text-inverse-foreground sm:p-8">
          <p className="text-xs font-bold tracking-wider text-accent uppercase">Sumber Inggris</p>
          <p className="mt-5 whitespace-pre-line leading-7">{data.source.meanings}</p>
          {data.source.formation ? <p className="mt-5 border-t border-inverse-border pt-5 text-sm">{data.source.formation}</p> : null}
          {data.source.examples ? <pre className="mt-5 whitespace-pre-wrap text-sm text-inverse-muted">{data.source.examples}</pre> : null}
        </aside>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <form action={saveTranslationDraft} className="grid gap-5">
            {commonInputs}
            <label className="grid gap-2 text-sm font-semibold">
              {data.source.type === 'grammar' ? 'Terjemahan makna' : 'Terjemahan makna, satu per baris'}
              <textarea className="min-h-28 rounded-xl border border-border bg-background px-4 py-3 font-normal" defaultValue={data.translation.meanings} name="meanings" required />
            </label>
            {data.source.type === 'grammar' ? (
              <>
                <label className="grid gap-2 text-sm font-semibold">Formation<textarea className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 font-normal" defaultValue={data.translation.formation} name="formation" /></label>
                <label className="grid gap-2 text-sm font-semibold">Tags<input className="rounded-xl border border-border bg-background px-4 py-3 font-normal" defaultValue={data.translation.tags} name="tags" /></label>
                <label className="grid gap-2 text-sm font-semibold">Notes<textarea className="min-h-24 rounded-xl border border-border bg-background px-4 py-3 font-normal" defaultValue={data.translation.notes} name="notes" /></label>
              </>
            ) : (
              <><input name="formation" type="hidden" value="" /><input name="tags" type="hidden" value="" /><input name="notes" type="hidden" value="" /></>
            )}
            {data.source.type !== 'kanji' ? (
              <label className="grid gap-2 text-sm font-semibold">Contoh terjemahan<textarea className="min-h-28 rounded-xl border border-border bg-background px-4 py-3 font-normal" defaultValue={data.translation.examples} name="examples" placeholder="日本語 | Terjemahan" /></label>
            ) : <input name="examples" type="hidden" value="" />}
            <div><SubmitButton pendingLabel="Menyimpan…">Simpan draft</SubmitButton></div>
          </form>

          <form action={submitTranslationReview} className="mt-4">
            {commonInputs}
            <SubmitButton pendingLabel="Mengirim…">Kirim untuk review</SubmitButton>
          </form>
        </section>
      </div>

      {data.canReview ? (
        <section className="mt-6 rounded-3xl border border-primary/25 bg-primary-soft p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-bold">Reviewer decision</h2>
          <form action={reviewTranslation} className="mt-5 grid gap-4 sm:grid-cols-[.35fr_1fr_auto] sm:items-end">
            {commonInputs}
            <label className="grid gap-2 text-sm font-semibold">Status<select className="rounded-xl border border-border bg-surface px-4 py-3 font-normal" defaultValue={data.translation.status === 'missing' ? 'draft' : data.translation.status} name="status"><option value="draft">Kembali ke draft</option><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="needs_review">Needs review</option></select></label>
            <label className="grid gap-2 text-sm font-semibold">Catatan<input className="rounded-xl border border-border bg-surface px-4 py-3 font-normal" defaultValue={data.translation.reviewNotes} name="review_notes" /></label>
            <SubmitButton pendingLabel="Memproses…">Simpan keputusan</SubmitButton>
          </form>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
        <h2 className="font-serif text-xl font-bold">Riwayat perubahan</h2>
        {data.revisions.length ? <ul className="mt-4 divide-y divide-border">{data.revisions.map((revision) => <li className="flex justify-between gap-4 py-3 text-sm" key={revision.id}><span>{revision.operation} · {revision.status}</span><time className="text-muted-foreground">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(revision.createdAt))}</time></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Belum ada revisi.</p>}
      </section>
    </main>
  );
}
