import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/lib/supabase/database.types';

const PROTECTED_PATHS = [
  '/admin',
  '/dashboard',
  '/editor',
  '/learn',
  '/review',
  '/onboarding',
  '/reports',
  '/translations',
  '/settings',
  '/auth/update-password',
];
const AUTH_PATHS = ['/auth/login', '/auth/register'];

function isPathWithin(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Kept separate so the proxy scope has a small, testable route contract. */
export function matchesAuthProxyRoute(pathname: string): boolean {
  return isPathWithin(pathname, [...PROTECTED_PATHS, ...AUTH_PATHS]);
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && isPathWithin(pathname, PROTECTED_PATHS)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPathWithin(pathname, AUTH_PATHS)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
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
  ],
};
