import { describe, expect, it } from 'vitest';

import { config, matchesAuthProxyRoute } from './proxy';

describe('auth proxy route scope', () => {
  it.each([
    ['/dashboard', true],
    ['/dashboard/activity', true],
    ['/learn/session-1', true],
    ['/settings', true],
    ['/auth/login', true],
    ['/auth/register', true],
    ['/auth/update-password', true],
    ['/catalog', false],
    ['/catalog/item-1', false],
    ['/', false],
    ['/attributions', false],
    ['/_next/static/chunk.js', false],
  ])('matches %s as %s', (pathname, expected) => {
    expect(matchesAuthProxyRoute(pathname)).toBe(expected);
  });

  it('uses only protected and authentication route prefixes in Next config', () => {
    expect(config.matcher).toEqual([
      '/dashboard/:path*',
      '/learn/:path*',
      '/review/:path*',
      '/onboarding/:path*',
      '/settings/:path*',
      '/editor/:path*',
      '/translations/:path*',
      '/reports/:path*',
      '/admin/:path*',
      '/auth/login',
      '/auth/register',
      '/auth/update-password',
    ]);
  });
});
