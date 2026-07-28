import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hak konten',
};

export default function ContentRightsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
        Hak konten
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
        Materi resmi © Kotomichi
      </h1>
      <div className="mt-8 grid gap-5 text-muted-foreground">
        <p>
          Deck resmi diterbitkan oleh Kotomichi. Pengguna yang mengajukan deck publik
          wajib menyatakan bahwa mereka memiliki hak untuk menerbitkan seluruh kosakata,
          makna, dan contoh kalimat di dalamnya.
        </p>
        <p>
          Deck publik tidak aktif sebelum reviewer menyetujuinya. Pelanggaran hak konten
          dapat menyebabkan deck ditolak atau diarsipkan tanpa menghapus progres belajar
          pengguna yang sudah tersimpan.
        </p>
      </div>
      <Link
        className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
        href="/decks"
      >
        Buka Library Deck
      </Link>
    </div>
  );
}
