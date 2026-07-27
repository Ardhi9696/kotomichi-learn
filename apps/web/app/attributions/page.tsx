import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atribusi & lisensi',
};

const sources = [
  {
    name: 'OpenJLPT',
    purpose: 'Dataset kanonis vocabulary, kanji, grammar, dan pembagian level.',
    license: 'CC BY-SA 4.0',
    href: 'https://github.com/evanclan/OpenJLPT',
  },
  {
    name: 'JMdict / EDICT dan KANJIDIC2 (EDRDG)',
    purpose: 'Reading, makna, jumlah coretan, grade, dan frekuensi.',
    license: 'CC BY-SA 4.0',
    href: 'https://www.edrdg.org/',
  },
  {
    name: "Jonathan Waller's JLPT Resources",
    purpose: 'Perkiraan pembagian vocabulary dan kanji N5–N1.',
    license: 'CC BY',
    href: 'https://www.tanos.co.uk/jlpt/',
  },
  {
    name: 'Tatoeba',
    purpose: 'Contoh kalimat bahasa Jepang dan terjemahan Inggris.',
    license: 'CC BY 2.0 FR',
    href: 'https://tatoeba.org/',
  },
] as const;

export default function AttributionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
        Transparansi sumber
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
        Atribusi & lisensi
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
        Kotomichi menggunakan OpenJLPT sebagai single source of truth. Data dan adaptasi
        terjemahan Indonesia/Korea didistribusikan mengikuti ketentuan ShareAlike.
      </p>

      <section className="mt-12 grid gap-4">
        {sources.map((source) => (
          <article className="rounded-2xl border border-border bg-surface p-6" key={source.name}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{source.name}</h2>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                {source.license}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{source.purpose}</p>
            <a
              className="mt-4 inline-block text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
              href={source.href}
              rel="noreferrer"
              target="_blank"
            >
              Kunjungi sumber
            </a>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl bg-inverse p-7 text-inverse-foreground">
        <h2 className="font-serif text-2xl font-bold">Catatan penting tentang JLPT</h2>
        <p className="mt-4 text-sm leading-7 text-inverse-muted">
          Japan Foundation dan organisasi JLPT tidak menerbitkan daftar vocabulary atau
          kanji resmi untuk N5–N1. Pembagian level di aplikasi ini merupakan perkiraan
          komunitas dari sumber terbuka dan tidak boleh dianggap sebagai silabus resmi.
        </p>
        <a
          className="mt-5 inline-block text-sm font-semibold text-accent underline underline-offset-4"
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          rel="noreferrer"
          target="_blank"
        >
          Baca lisensi CC BY-SA 4.0
        </a>
      </section>
    </div>
  );
}
