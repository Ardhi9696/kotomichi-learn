import type { Metadata } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP, Plus_Jakarta_Sans } from 'next/font/google';

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

const themeBootstrapScript = `(function(){try{var d=document.documentElement;if(d.dataset.themeSource==="profile")return;var t=localStorage.getItem("kotomichi-theme");if(t==="light"||t==="dark"||t==="system")d.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      data-scroll-behavior="smooth"
      data-theme="system"
      data-theme-source="local"
      lang="id"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${jakarta.variable} ${notoSansJp.variable} ${notoSerifJp.variable}`}>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background focus:translate-y-0"
          href="#main-content"
        >
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
