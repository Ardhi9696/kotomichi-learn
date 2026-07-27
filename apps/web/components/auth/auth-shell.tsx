import Link from 'next/link';

import { BrandMark } from '@/components/brand-mark';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="paper-grid min-h-[calc(100vh-7rem)] px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-surface shadow-card lg:grid-cols-[.86fr_1.14fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
          <div className="sun-disc absolute -right-32 -bottom-28 size-96 rounded-full opacity-45" />
          <Link className="relative flex items-center gap-3 font-semibold" href="/">
            <BrandMark />
            Kotomichi Learn
          </Link>
          <div className="relative my-auto py-16">
            <p className="text-xs font-bold tracking-[0.2em] text-primary-foreground/70 uppercase">
              一歩ずつ
            </p>
            <p className="mt-5 font-serif text-4xl leading-tight font-bold">
              Setiap perjalanan dimulai dari satu langkah kecil.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/75">
              Simpan target, lanjutkan progres di perangkat lain, dan bangun kebiasaan
              belajar yang konsisten.
            </p>
          </div>
          <p className="relative text-xs text-primary-foreground/65">
            Materi terbuka · Progres milikmu
          </p>
        </aside>

        <section className="p-6 sm:p-10 lg:p-14">
          <div className="mb-9 lg:hidden">
            <Link className="flex items-center gap-3 font-semibold" href="/">
              <BrandMark />
              Kotomichi Learn
            </Link>
          </div>
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          {footer ? (
            <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
