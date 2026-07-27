import Link from 'next/link';

import { BrandMark } from '@/components/brand-mark';
import { ThemeSwitcher } from '@/components/theme-switcher';
import type { ThemePreference } from '@/features/settings/profile-schema';

const navigation = [
  { href: '/catalog', label: 'Materi' },
  { href: '/learn', label: 'Mulai belajar' },
  { href: '/attributions', label: 'Tentang sumber' },
] as const;

export function SiteHeader({
  initialTheme = 'system',
  isAuthenticated = false,
}: {
  initialTheme?: ThemePreference;
  isAuthenticated?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center gap-5 px-5 sm:px-8">
        <Link
          className="flex shrink-0 items-center gap-3 rounded-lg font-semibold tracking-tight focus-visible:outline-2"
          href="/"
        >
          <BrandMark />
          <span>Kotomichi</span>
          <span className="hidden text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase sm:inline">
            Learn
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="ml-auto hidden items-center gap-1 md:flex"
        >
          {navigation.map((item) => (
            <Link
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground focus-visible:outline-2"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <ThemeSwitcher initialTheme={initialTheme} persist={isAuthenticated} />
          {!isAuthenticated ? (
            <Link
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-surface hover:text-primary focus-visible:outline-2 sm:inline-flex"
              href="/auth/login"
            >
              Masuk
            </Link>
          ) : null}
          <Link
            className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-2"
            href="/dashboard"
          >
            {isAuthenticated ? 'Dashboard' : 'Mulai sekarang'}
          </Link>
        </div>
      </div>

      <nav
        aria-label="Navigasi utama mobile"
        className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden"
      >
        {navigation.slice(0, 2).map((item) => (
          <Link
            className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
