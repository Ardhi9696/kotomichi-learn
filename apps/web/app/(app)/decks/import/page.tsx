import type { Metadata } from 'next';
import Link from 'next/link';

import { DeckImporter } from '@/features/decks/deck-importer';
import { getDeckImportData, getMyDecks } from '@/features/decks/queries';

export const metadata: Metadata = { title: 'Import deck' };

type ImportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ImportDeckPage({ searchParams }: ImportPageProps) {
  const params = await searchParams;
  const rawDeckId = Array.isArray(params.deck) ? params.deck[0] : params.deck;

  if (!rawDeckId) {
    const { decks } = await getMyDecks();
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-serif text-4xl font-bold">Pilih deck untuk import</h1>
        <div className="mt-7 grid gap-3">
          {decks.map((deck) => (
            <Link
              className="rounded-xl border border-border bg-surface p-5 font-semibold"
              href={`/decks/import?deck=${deck.id}`}
              key={deck.id}
            >
              {deck.title} →
            </Link>
          ))}
          {!decks.length ? (
            <Link className="text-primary underline" href="/decks">
              Buat deck terlebih dahulu
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const data = await getDeckImportData(rawDeckId);
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <Link className="text-sm font-semibold text-muted-foreground" href="/decks">
        ← My Decks
      </Link>
      <h1 className="mt-5 font-serif text-4xl font-bold">Import · {data.deck.title}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Satu baris menghasilkan satu materi vocabulary. Recognition dan Production
        dibentuk oleh aplikasi; HTML kartu tidak diimpor.
      </p>
      <DeckImporter
        currentRows={data.currentRows}
        deck={data.deck}
        userId={data.userId}
      />
    </div>
  );
}
