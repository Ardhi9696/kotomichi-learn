'use client';

import { useRef, useState, useSyncExternalStore, useTransition } from 'react';

import { saveThemePreference } from '@/app/settings/actions';
import type { ThemePreference } from '@/features/settings/profile-schema';
import {
  applyThemePreference,
  getThemeSnapshot,
  subscribeToTheme,
} from '@/lib/theme';

const themeOptions = [
  { value: 'light', label: 'Terang', icon: 'sun' },
  { value: 'dark', label: 'Gelap', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'system' },
] as const;

export function ThemeSwitcher({
  initialTheme,
  persist = false,
}: {
  initialTheme: ThemePreference;
  persist?: boolean;
}) {
  const [saveFailed, setSaveFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => initialTheme,
  );

  function selectTheme(nextTheme: ThemePreference) {
    applyThemePreference(nextTheme);
    setSaveFailed(false);
    detailsRef.current?.removeAttribute('open');

    if (persist) {
      startTransition(async () => {
        const result = await saveThemePreference(nextTheme);
        setSaveFailed(!result.success);
      });
    }
  }

  const selected = themeOptions.find((option) => option.value === theme);

  return (
    <details className="relative" ref={detailsRef}>
      <summary
        aria-label={`Tema: ${selected?.label ?? 'Sistem'}`}
        className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-border bg-surface text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-2"
        title="Ubah tema"
      >
        <ThemeIcon name={selected?.icon ?? 'system'} />
      </summary>
      <div className="absolute top-full right-0 z-50 mt-2 w-44 rounded-2xl border border-border bg-surface p-2 shadow-card">
        <p className="px-3 py-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Tampilan
        </p>
        {themeOptions.map((option) => {
          const active = option.value === theme;
          return (
            <button
              aria-pressed={active}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
              }`}
              disabled={pending}
              key={option.value}
              onClick={() => selectTheme(option.value)}
              type="button"
            >
              <ThemeIcon name={option.icon} />
              {option.label}
              {active ? <span className="ml-auto">✓</span> : null}
            </button>
          );
        })}
        {saveFailed ? (
          <p className="px-3 pt-2 text-xs leading-5 text-danger-foreground" role="status">
            Tema diterapkan, tetapi belum tersimpan ke akun.
          </p>
        ) : null}
      </div>
    </details>
  );
}

function ThemeIcon({ name }: { name: 'sun' | 'moon' | 'system' }) {
  if (name === 'sun') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="3.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.35 4.35l1.05 1.05M14.6 14.6l1.05 1.05M15.65 4.35 14.6 5.4M5.4 14.6l-1.05 1.05"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (name === 'moon') {
    return (
      <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
        <path
          d="M16.2 12.9A7 7 0 0 1 7.1 3.8 7 7 0 1 0 16.2 12.9Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <rect height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="16" x="2" y="3" />
      <path d="M7 17h6M10 13.5V17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}
