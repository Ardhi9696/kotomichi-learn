import Link from 'next/link';

import { BrandMark } from '@/components/brand-mark';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-3 font-semibold">
            <BrandMark />
            Kotomichi Learn
          </div>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Jalur belajar bahasa Jepang berbasis data terbuka OpenJLPT. Daftar level
            merupakan perkiraan komunitas dan bukan daftar resmi JLPT.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link className="hover:text-primary" href="/attributions">
            Atribusi & lisensi
          </Link>
          <a
            className="hover:text-primary"
            href="https://github.com/evanclan/OpenJLPT"
            rel="noreferrer"
            target="_blank"
          >
            Sumber data
          </a>
        </div>
      </div>
    </footer>
  );
}
