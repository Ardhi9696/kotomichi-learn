'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { logout } from '@/lib/auth/actions';
import { BrandMark } from '@/components/brand-mark';
import { ThemeSwitcher } from '@/components/theme-switcher';
import type { ThemePreference } from '@/features/settings/profile-schema';

type AppRole = 'editor' | 'reviewer' | 'admin' | 'superadmin';

export type AppViewer = {
  displayName: string;
  email: string;
  targetLevel: string;
  theme: ThemePreference;
  roles: AppRole[];
};

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon:
    | 'dashboard'
    | 'learn'
    | 'review'
    | 'catalog'
    | 'settings'
    | 'editor'
    | 'translation'
    | 'reports'
    | 'admin'
    | 'source';
  match?: 'exact' | 'prefix';
};

const learnerNavigation: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Ringkasan',
    description: 'Progres dan aktivitas',
    icon: 'dashboard',
    match: 'exact',
  },
  {
    href: '/learn',
    label: 'Mulai belajar',
    description: 'Sesi materi baru',
    icon: 'learn',
    match: 'prefix',
  },
  {
    href: '/review',
    label: 'Review',
    description: 'Materi jatuh tempo',
    icon: 'review',
    match: 'prefix',
  },
  {
    href: '/catalog',
    label: 'Katalog',
    description: 'Jelajahi materi aktif',
    icon: 'catalog',
    match: 'prefix',
  },
  {
    href: '/decks',
    label: 'Decks',
    description: 'Library dan deck milikmu',
    icon: 'source',
    match: 'prefix',
  },
  {
    href: '/settings',
    label: 'Pengaturan',
    description: 'Profil dan preferensi',
    icon: 'settings',
    match: 'prefix',
  },
];

const editorialNavigation: NavItem[] = [
  {
    href: '/decks/review',
    label: 'Review Deck',
    description: 'Antrean publikasi',
    icon: 'source',
    match: 'prefix',
  },
  {
    href: '/editor',
    label: 'Kelola materi',
    description: 'CRUD konten',
    icon: 'editor',
    match: 'prefix',
  },
  {
    href: '/translations',
    label: 'Terjemahan',
    description: 'Draft dan review',
    icon: 'translation',
    match: 'prefix',
  },
  {
    href: '/reports',
    label: 'Laporan',
    description: 'Triase koreksi',
    icon: 'reports',
    match: 'prefix',
  },
];

const adminNavigation: NavItem[] = [
  {
    href: '/admin',
    label: 'Superadmin',
    description: 'Role dan sistem',
    icon: 'admin',
    match: 'exact',
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavIcon({ name }: { name: NavItem['icon'] }) {
  const paths: Record<NavItem['icon'], React.ReactNode> = {
    dashboard: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <rect height="7" rx="1" width="7" x="14" y="14" />
      </>
    ),
    learn: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23.5z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5a3.5 3.5 0 0 1 3.5 3.5z" />
      </>
    ),
    review: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    catalog: (
      <>
        <rect height="16" rx="2" width="7" x="3" y="4" />
        <rect height="16" rx="2" width="7" x="14" y="4" />
        <path d="M6.5 8h0M17.5 8h0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    editor: (
      <>
        <path d="m4 16-1 5 5-1L20 8l-4-4Z" />
        <path d="m14 6 4 4M3 21h18" />
      </>
    ),
    translation: (
      <>
        <path d="M4 5h10M9 3v2c0 5-2 8-6 10" />
        <path d="M6 10c1 2 3 4 6 5M14 21l4-10 4 10M15.5 17h5" />
      </>
    ),
    reports: (
      <>
        <path d="M5 21V4" />
        <path d="M5 5h11l-2 4 2 4H5" />
      </>
    ),
    admin: (
      <>
        <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    source: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function NavigationGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="px-3 text-[0.68rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                aria-current={active ? 'page' : undefined}
                className={`group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 transition focus-visible:outline-2 ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_rgb(201_44_35_/_18%)]'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
                href={item.href}
                onClick={onNavigate}
                prefetch={true}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    active
                      ? 'bg-primary-foreground/15'
                      : 'bg-background text-muted-foreground group-hover:text-primary'
                  }`}
                >
                  <NavIcon name={item.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span
                    className={`block truncate text-[0.68rem] ${
                      active ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({
  pathname,
  viewer,
  onNavigate,
}: {
  pathname: string;
  viewer: AppViewer;
  onNavigate?: () => void;
}) {
  const isEditorial = viewer.roles.some((role) =>
    ['editor', 'reviewer', 'admin', 'superadmin'].includes(role),
  );
  const isSuperadmin = viewer.roles.includes('superadmin');
  const initials =
    viewer.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'K';

  return (
    <>
      <div className="flex h-19 items-center border-b border-border px-5">
        <Link
          className="flex items-center gap-3 rounded-lg font-semibold tracking-tight focus-visible:outline-2"
          href="/dashboard"
          onClick={onNavigate}
        >
          <BrandMark />
          <span>
            <span className="block leading-tight">Kotomichi</span>
            <span className="block text-[0.62rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              Learning space
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Navigasi dashboard"
        className="flex-1 space-y-6 overflow-y-auto px-4 py-5"
      >
        <NavigationGroup
          items={learnerNavigation}
          label="Belajar"
          onNavigate={onNavigate}
          pathname={pathname}
        />
        {isEditorial ? (
          <NavigationGroup
            items={editorialNavigation}
            label="Editorial"
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ) : null}
        {isSuperadmin ? (
          <NavigationGroup
            items={adminNavigation}
            label="Administrasi"
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ) : null}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-2xl bg-background p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {viewer.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Target {viewer.targetLevel} · {viewer.email}
              </span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              className="rounded-lg border border-border bg-surface px-3 py-2 text-center text-xs font-semibold hover:border-primary/40 hover:text-primary"
              href="/"
              onClick={onNavigate}
            >
              Beranda
            </Link>
            <form action={logout} onSubmit={(e) => { if (!window.confirm('Yakin ingin keluar?')) e.preventDefault(); }}>
              <button
                className="h-full w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
                type="submit"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppNavigation({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: AppViewer;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const availableItems = useMemo(() => {
    const items = [...learnerNavigation];
    if (
      viewer.roles.some((role) =>
        ['editor', 'reviewer', 'admin', 'superadmin'].includes(role),
      )
    ) {
      items.push(...editorialNavigation);
    }
    if (viewer.roles.includes('superadmin')) items.push(...adminNavigation);
    return items;
  }, [viewer]);
  const pageLabel =
    availableItems.find((item) => isActive(pathname, item))?.label ?? 'Kotomichi';

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const drawer = document.getElementById('mobile-dashboard-navigation');
      const focusable = drawer?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      trigger?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent pathname={pathname} viewer={viewer} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/92 px-4 backdrop-blur-xl lg:hidden">
          <button
            aria-controls="mobile-dashboard-navigation"
            aria-expanded={mobileOpen}
            aria-label="Buka menu dashboard"
            className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-foreground"
            onClick={() => setMobileOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold">{pageLabel}</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher initialTheme={viewer.theme} persist />
            <Link
              aria-label="Buka pengaturan"
              className="grid size-10 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary"
              href="/settings"
            >
              {viewer.displayName.slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Tutup menu dashboard"
              className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
              type="button"
            />
            <aside
              aria-label="Menu dashboard"
              aria-modal="true"
              className="relative flex h-full w-[min(88vw,18rem)] flex-col border-r border-border bg-surface shadow-2xl"
              id="mobile-dashboard-navigation"
              role="dialog"
            >
              <button
                aria-label="Tutup menu"
                className="absolute top-5 right-4 z-10 grid size-9 place-items-center rounded-lg border border-border bg-background"
                onClick={() => setMobileOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
              <SidebarContent
                onNavigate={() => setMobileOpen(false)}
                pathname={pathname}
                viewer={viewer}
              />
            </aside>
          </div>
        ) : null}

        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
