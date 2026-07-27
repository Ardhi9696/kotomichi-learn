import Link from 'next/link';

import { ArrowIcon } from '@/components/arrow-icon';

const levels = [
  { level: 'N5', label: 'Fondasi', description: 'Mulai dari kosakata dan pola paling dasar.' },
  { level: 'N4', label: 'Dasar', description: 'Bangun percakapan sehari-hari yang lebih luas.' },
  { level: 'N3', label: 'Menengah', description: 'Jembatani bahasa praktis dan formal.' },
  { level: 'N2', label: 'Mahir', description: 'Pahami teks dan konteks yang lebih kompleks.' },
  { level: 'N1', label: 'Lanjutan', description: 'Asah nuansa untuk tingkat tertinggi JLPT.' },
] as const;

const features = [
  {
    number: '01',
    title: 'Materi yang tertata',
    body: 'Vocabulary, kanji, dan grammar berada dalam satu jalur dari N5 hingga N1.',
  },
  {
    number: '02',
    title: 'Belajar dalam konteks',
    body: 'Reading, makna, metadata kanji, dan contoh kalimat tersedia saat sumber mencukupi.',
  },
  {
    number: '03',
    title: 'Terbuka & transparan',
    body: 'Materi kanonis berasal dari OpenJLPT dengan atribusi dan fallback Inggris yang jelas.',
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="paper-grid overflow-hidden border-b border-border">
        <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="reveal">
            <div className="mb-7 flex items-center gap-3 text-xs font-bold tracking-[0.22em] text-primary uppercase">
              <span className="h-px w-9 bg-primary" />
              JLPT learning path · N5—N1
            </div>
            <h1 className="max-w-3xl font-serif text-[clamp(2.75rem,7vw,5.6rem)] leading-[1.02] font-bold tracking-[-0.045em]">
              Temukan jalanmu menuju{' '}
              <span className="relative text-primary">
                bahasa Jepang
                <span className="absolute right-0 -bottom-2 left-0 h-1 rounded-full bg-accent/80" />
              </span>
              .
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
              Kotomichi menyusun 10.645 materi OpenJLPT menjadi perjalanan belajar yang
              jernih—mulai dari kata pertama di N5 hingga nuansa lanjutan di N1.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-2"
                href="/catalog?level=N5&type=all"
              >
                Mulai dari N5
                <ArrowIcon />
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3.5 font-semibold transition hover:border-primary/40 hover:text-primary focus-visible:outline-2"
                href="/catalog"
              >
                Jelajahi materi
              </Link>
            </div>
            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-5 border-t border-border pt-7">
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Kosakata
                </dt>
                <dd className="mt-1 text-2xl font-bold">8.334</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Kanji
                </dt>
                <dd className="mt-1 text-2xl font-bold">2.211</dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Grammar
                </dt>
                <dd className="mt-1 text-2xl font-bold">100</dd>
              </div>
            </dl>
          </div>

          <div className="reveal-late relative mx-auto aspect-square w-full max-w-[520px]">
            <div className="sun-disc absolute inset-[10%] rounded-full" />
            <div
              className="absolute top-[8%] right-[3%] rounded-full border border-overlay-border bg-overlay px-4 py-2 text-xs font-semibold text-overlay-foreground shadow-sm"
              data-testid="daily-step-badge"
            >
              毎日、一歩ずつ
            </div>
            <div className="absolute inset-0 grid place-items-center text-white">
              <div className="torii" />
            </div>
            <div className="absolute bottom-[4%] left-[2%] w-[72%] rounded-3xl border border-white/80 bg-surface/95 p-5 shadow-card backdrop-blur sm:p-7">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  N5 · Vocabulary
                </span>
                <span className="text-xs text-muted-foreground">今日の言葉</span>
              </div>
              <p className="mt-5 font-serif text-4xl font-bold">道</p>
              <p className="mt-1 text-sm text-muted-foreground">みち · michi</p>
              <p className="mt-4 font-semibold">jalan; cara; perjalanan</p>
            </div>
            <div className="vertical-label absolute top-[25%] -right-2 text-sm font-semibold tracking-[0.3em] text-primary-hover">
              言葉の道
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
              Satu jalur, lima tingkat
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight font-bold tracking-tight">
              Belajar sesuai tempatmu berada.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Tidak harus terburu-buru. Pilih target, lihat cakupan materi, lalu mulai dari
              satu langkah yang terasa masuk akal.
            </p>
          </div>
          <div className="grid gap-3">
            {levels.map((item, index) => (
              <Link
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
                href={`/catalog?level=${item.level}&type=all`}
                key={item.level}
              >
                <span className="grid size-12 place-items-center rounded-full bg-primary-soft font-bold text-primary">
                  {item.level}
                </span>
                <span>
                  <span className="font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    0{index + 1}
                  </span>
                  <span className="text-primary transition group-hover:translate-x-1">
                    <ArrowIcon />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-inverse-border bg-inverse text-inverse-foreground"
        data-section="learning-benefits"
      >
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-accent uppercase">
              Dibuat untuk benar-benar belajar
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight font-bold">
              Lebih sedikit distraksi, lebih banyak pemahaman.
            </h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-inverse-border bg-inverse-border md:grid-cols-3">
            {features.map((feature) => (
              <article className="bg-inverse-surface p-7 sm:p-9" key={feature.number}>
                <span className="text-sm font-bold text-accent">{feature.number}</span>
                <h3 className="mt-10 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-inverse-muted">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-7 py-14 text-white sm:px-12 lg:px-16">
          <div className="absolute -top-24 -right-20 size-72 rounded-full border-[48px] border-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold tracking-[0.22em] text-white/70 uppercase">
              Langkah pertama
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight font-bold">
              Satu kata hari ini bisa membuka satu dunia esok hari.
            </h2>
            <Link
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-primary transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white"
              href="/catalog?level=N5&type=all"
            >
              Buka materi N5
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
