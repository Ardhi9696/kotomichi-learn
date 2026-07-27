import type { Metadata } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP, Plus_Jakarta_Sans } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ['latin'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Kotomichi — Belajar JLPT N5 sampai N1',
    template: '%s · Kotomichi',
  },
  description:
    'Belajar vocabulary, kanji, dan grammar JLPT N5–N1 dengan jalur yang terstruktur.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakarta.variable} ${notoSansJp.variable} ${notoSerifJp.variable}`}>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background focus:translate-y-0"
          href="#main-content"
        >
          Lewati ke konten
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
