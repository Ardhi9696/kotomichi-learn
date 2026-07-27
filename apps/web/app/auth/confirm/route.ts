import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { safeRedirectPath } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/server';

const OTP_TYPES: EmailOtpType[] = [
  'email',
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return OTP_TYPES.some((type) => type === value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = safeRedirectPath(url.searchParams.get('next'), '/onboarding');
  const supabase = await createClient();

  let hasError = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    hasError = Boolean(error);
  } else if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    hasError = Boolean(error);
  } else {
    hasError = true;
  }

  if (hasError) {
    const loginUrl = new URL('/auth/login', url.origin);
    loginUrl.searchParams.set(
      'error',
      'Tautan konfirmasi tidak valid atau sudah kedaluwarsa.',
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
