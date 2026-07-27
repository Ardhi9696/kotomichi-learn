'use client';

import { useState } from 'react';

import type { ThemePreference } from '@/features/settings/profile-schema';
import { applyThemePreference } from '@/lib/theme';

export function ThemePreferenceSelect({
  initialTheme,
}: {
  initialTheme: ThemePreference;
}) {
  const [theme, setTheme] = useState(initialTheme);

  return (
    <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
      Tema
      <select
        aria-label="Tema"
        className="h-12 rounded-xl border border-border bg-background px-4 font-normal"
        name="theme"
        onChange={(event) => {
          const nextTheme = event.target.value as ThemePreference;
          setTheme(nextTheme);
          applyThemePreference(nextTheme);
        }}
        value={theme}
      >
        <option value="light">Terang</option>
        <option value="dark">Gelap</option>
        <option value="system">Ikuti sistem</option>
      </select>
      <span className="text-xs font-normal text-muted-foreground">
        Perubahan dipratinjau langsung dan disimpan bersama pengaturan akun.
      </span>
    </label>
  );
}
