import { signInWithGoogle } from '@/app/auth/actions';

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.27.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthForm({
  next,
  authPath,
}: {
  next: string;
  authPath: '/auth/login' | '/auth/register';
}) {
  return (
    <>
      <form action={signInWithGoogle}>
        <input name="next" type="hidden" value={next} />
        <input name="auth_path" type="hidden" value={authPath} />
        <button
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-5 font-semibold transition hover:border-primary/45 hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
          type="submit"
        >
          <GoogleMark />
          Lanjutkan dengan Google
        </button>
      </form>
      <div className="my-6 flex items-center gap-4" role="separator">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          atau dengan email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
