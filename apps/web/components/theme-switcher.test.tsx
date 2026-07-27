import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemePreferenceSelect } from '@/components/theme-preference-select';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { saveThemePreference } from '@/app/settings/actions';

vi.mock('@/app/settings/actions', () => ({
  saveThemePreference: vi.fn(async () => ({ success: true })),
}));

const themeStorage = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    clear: () => themeStorage.clear(),
    getItem: (key: string) => themeStorage.get(key) ?? null,
    removeItem: (key: string) => themeStorage.delete(key),
    setItem: (key: string, value: string) => themeStorage.set(key, value),
  },
});

beforeEach(() => {
  document.documentElement.dataset.theme = 'system';
  window.localStorage.clear();
  vi.mocked(saveThemePreference).mockClear();
});

describe('ThemeSwitcher', () => {
  it('applies and stores light, dark, and system preferences', () => {
    render(<ThemeSwitcher initialTheme="system" />);

    fireEvent.click(screen.getByLabelText('Tema: Sistem'));
    fireEvent.click(screen.getByRole('button', { name: 'Gelap' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('kotomichi-theme')).toBe('dark');

    fireEvent.click(screen.getByLabelText('Tema: Gelap'));
    fireEvent.click(screen.getByRole('button', { name: 'Sistem' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'system');
  });

  it('persists authenticated theme changes', async () => {
    document.documentElement.dataset.theme = 'light';
    render(<ThemeSwitcher initialTheme="light" persist />);

    fireEvent.click(screen.getByLabelText('Tema: Terang'));
    fireEvent.click(screen.getByRole('button', { name: 'Gelap' }));

    await waitFor(() => {
      expect(saveThemePreference).toHaveBeenCalledWith('dark');
    });
  });
});

describe('ThemePreferenceSelect', () => {
  it('previews the selected account theme immediately', () => {
    render(<ThemePreferenceSelect initialTheme="light" />);

    fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'dark' } });

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
