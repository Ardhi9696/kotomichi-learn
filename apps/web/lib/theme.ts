import type { ThemePreference } from '@/features/settings/profile-schema';

export const THEME_STORAGE_KEY = 'kotomichi-theme';
export const THEME_EVENT = 'kotomichi-theme-change';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function applyThemePreference(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme still applies for the current document when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function getThemeSnapshot(): ThemePreference {
  const theme = document.documentElement.dataset.theme;
  return isThemePreference(theme) ? theme : 'system';
}

export function subscribeToTheme(onStoreChange: () => void) {
  function handleThemeChange() {
    onStoreChange();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY || !isThemePreference(event.newValue)) return;
    document.documentElement.dataset.theme = event.newValue;
    onStoreChange();
  }

  window.addEventListener(THEME_EVENT, handleThemeChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, handleThemeChange);
    window.removeEventListener('storage', handleStorage);
  };
}
