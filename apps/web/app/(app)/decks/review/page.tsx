import type { Metadata } from 'next';

import { approveDeckImport, rejectDeckImport } from '@/features/decks/actions';
import { getDeckReviewQueue } from '@/features/decks/queries';

export const metadata: Metadata = { title: 'Review deck' };

export default async function DeckReviewPage() {
  const queue = await getDeckReviewQueue();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
        Moderasi
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold">Review Queue</h1>
      <div className="mt-8 grid gap-5">
        {queue.map((item) => (
          <article className="rounded-2xl border border-border bg-surface p-6" key={item.id}>
            <h2 className="font-serif text-2xl font-bold">{item.decks.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Checksum {item.checksum.slice(0, 12)}… · {new Date(item.created_at).toLocaleDateString('id-ID')}
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-background p-4 text-xs">
              {JSON.stringify(item.diff, null, 2)}
            </pre>
            <p className="mt-4 text-sm">
              Pernyataan hak: {item.decks.rights_attestation ?? 'Versi lanjutan deck publik'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={approveDeckImport.bind(null, item.id)}>
                <button className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">
                  Setujui dan aktifkan
                </button>
              </form>
              <form action={rejectDeckImport.bind(null, item.id)} className="flex gap-2">
                <input
                  className="rounded-full border border-border bg-background px-4"
                  name="notes"
                  placeholder="Alasan penolakan"
                />
                <button className="rounded-full border border-danger-border px-5 py-2.5 font-semibold text-danger-foreground">
                  Tolak
                </button>
              </form>
            </div>
          </article>
        ))}
        {!queue.length ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
            Tidak ada versi deck yang menunggu review.
          </p>
        ) : null}
      </div>
    </div>
  );
}
