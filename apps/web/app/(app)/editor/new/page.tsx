import type { Metadata } from 'next';
import Link from 'next/link';

import { EditorialContentForm } from '@/features/editor/content-form';
import { emptyEditorContent } from '@/features/editor/queries';
import { requireEditorial } from '@/lib/auth/require-editorial';

export const metadata: Metadata = {
  title: 'Tambah materi',
};

type NewEditorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewEditorPage({ searchParams }: NewEditorPageProps) {
  await requireEditorial();
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-primary hover:underline" href="/editor">
        ← Kembali ke editor
      </Link>
      <header className="mt-6 border-b border-border pb-8">
        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
          Materi editorial
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold">Tambah materi</h1>
      </header>
      {error ? (
        <div className="mt-6 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger-foreground" role="alert">
          {error}
        </div>
      ) : null}
      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <EditorialContentForm initial={emptyEditorContent()} />
      </section>
    </main>
  );
}
