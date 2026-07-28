import type { Metadata } from 'next';
import Link from 'next/link';

import {
  archiveDeck,
  createDeck,
  submitDeckPublication,
} from '@/features/decks/actions';
import { getDeckLibrary, getMyDecks } from '@/features/decks/queries';

export const metadata: Metadata = { title: 'Deck' };

type DeckPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeckPage({ searchParams }: DeckPageProps) {
  const [library, mine, params] = await Promise.all([
    getDeckLibrary(),
    getMyDecks(),
    searchParams,
  ]);
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            Deck mandiri
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Library Deck</h1>
          <p className="mt-3 text-muted-foreground">
            Materi resmi Kotomichi dan deck komunitas yang sudah melalui review.
          </p>
        </div>
        <Link
          className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground"
          href="/decks/import"
        >
          Import TSV
        </Link>
      </header>

      {message || error ? (
        <p
          className={`mt-7 rounded-xl border px-4 py-3 text-sm ${
            error
              ? 'border-danger-border bg-danger-soft text-danger-foreground'
              : 'border-border bg-surface'
          }`}
          role={error ? 'alert' : 'status'}
        >
          {error ?? message}
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold">Library</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {library.map((deck) => (
            <article className="rounded-2xl border border-border bg-surface p-6" key={deck.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl font-bold">{deck.title}</h3>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  {deck.kind === 'official' ? 'Kotomichi' : 'Publik'}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {deck.description || 'Deck vocabulary terkurasi.'}
              </p>
            </article>
          ))}
          {!library.length ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">
              Belum ada deck publik yang disetujui.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-bold">My Decks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {mine.decks.map((deck) => (
            <article className="rounded-2xl border border-border bg-surface p-6" key={deck.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl font-bold">{deck.title}</h3>
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  {deck.visibility} · {deck.review_status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{deck.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                  href={`/decks/import?deck=${deck.id}`}
                >
                  Import ulang
                </Link>
                {deck.active_import_id && deck.review_status !== 'pending' ? (
                  <details>
                    <summary className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold">
                      Ajukan publikasi
                    </summary>
                    <form
                      action={submitDeckPublication.bind(
                        null,
                        deck.id,
                        deck.active_import_id,
                      )}
                      className="mt-3 grid gap-2 rounded-xl border border-border p-3"
                    >
                      <textarea
                        className="min-h-24 rounded-lg border border-border bg-background p-3 text-sm"
                        name="attestation"
                        placeholder="Saya menyatakan memiliki hak untuk menerbitkan seluruh konten deck ini…"
                        required
                      />
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
                        Kirim ke reviewer
                      </button>
                    </form>
                  </details>
                ) : null}
                <form action={archiveDeck.bind(null, deck.id)}>
                  <button className="rounded-full px-4 py-2 text-sm font-semibold text-danger-foreground">
                    Arsipkan
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 max-w-2xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-serif text-2xl font-bold">Buat deck baru</h2>
        <form action={createDeck} className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold">
            Nama deck
            <input className="rounded-xl border border-border bg-background px-4 py-3" name="title" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Deskripsi
            <textarea className="min-h-24 rounded-xl border border-border bg-background p-4" name="description" />
          </label>
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
            Buat dan import
          </button>
        </form>
      </section>
    </div>
  );
}
