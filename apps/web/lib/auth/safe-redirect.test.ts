import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps internal paths and query strings', () => {
    expect(safeRedirectPath('/catalog?level=N5')).toBe('/catalog?level=N5');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.example')).toBe('/dashboard');
  });

  it('uses the supplied fallback for missing values', () => {
    expect(safeRedirectPath(null, '/auth/login')).toBe('/auth/login');
  });
});
