const FALLBACK_PATH = '/dashboard';

export function safeRedirectPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = FALLBACK_PATH,
): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const parsed = new URL(value, 'https://kotomichi.local');
    return parsed.origin === 'https://kotomichi.local'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
