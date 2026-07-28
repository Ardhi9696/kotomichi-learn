import type { Metadata } from 'next';
import Link from 'next/link';

import { setContentActive } from '@/features/editor/actions';
import { EditorialContentForm } from '@/features/editor/content-form';
import { getEditorContent } from '@/features/editor/queries';

export const metadata: Metadata = {
  title: 'Edit materi',
};

type EditContentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditContentPage({
  params,
  searchParams,
}: EditContentPageProps) {
  const { id } = await params;
  const [content, query] = await Promise.all([getEditorContent(id), searchParams]);
  const message = Array.isArray(query.message) ? query.message[0] : query.message;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-primary hover:underline" href="/editor">
        ← Kembali ke editor
      </Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-5 border-b border-border pb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            {content.origin === 'openjlpt' ? 'Override materi lama' : 'Materi editorial'}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Edit materi</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {content.isActive ? (
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:text-primary"
              href={`/catalog/${content.id}`}
            >
              Lihat publik
            </Link>
          ) : null}
          <form action={setContentActive}>
            <input name="content_item_id" type="hidden" value={content.id ?? ''} />
            <input
              name="is_active"
              type="hidden"
              value={content.isActive ? 'false' : 'true'}
            />
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                content.isActive
                  ? 'border border-danger-border text-danger-foreground hover:bg-danger-soft'
                  : 'border border-success-border text-success-foreground hover:bg-success-soft'
              }`}
              type="submit"
            >
              {content.isActive ? 'Arsipkan' : 'Pulihkan'}
            </button>
          </form>
        </div>
      </header>

      {message ? (
        <div className="mt-6 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-sm text-success-foreground" role="status">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground" role="alert">
          {error}
        </div>
      ) : null}

      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <EditorialContentForm initial={content} />
      </section>
    </main>
  );
}
