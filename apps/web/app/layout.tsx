import type { Metadata } from 'next';
import { Noto_Sans_JP, Noto_Serif_JP, Plus_Jakarta_Sans } from 'next/font/google';

import { AppShell } from '@/components/app-shell';
import { createClient } from '@/lib/supabase/server';

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profileResult, rolesResult] = user
    ? await Promise.all([
        supabase
          .from('profiles')
          .select('display_name,target_level,theme')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', user.id),
      ])
    : [{ data: null }, { data: [] }];
  const profile = profileResult.data;
  const theme =
    profile?.theme === 'dark' || profile?.theme === 'system'
      ? profile.theme
      : 'light';

  return (
    <html data-scroll-behavior="smooth" data-theme={theme} lang="id">
      <body className={`${jakarta.variable} ${notoSansJp.variable} ${notoSerifJp.variable}`}>
        <a
          className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background focus:translate-y-0"
          href="#main-content"
        >
          Lewati ke konten
        </a>
        <AppShell
          viewer={
            user
              ? {
                  displayName:
                    profile?.display_name ?? user.email?.split('@')[0] ?? 'Learner',
                  email: user.email ?? '',
                  targetLevel: profile?.target_level ?? 'N5',
                  roles: rolesResult.data?.map((row) => row.role) ?? [],
                }
              : null
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
