'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 py-20 text-center">
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-primary uppercase">
          Terjadi kendala
        </p>
        <h1 className="mt-4 font-serif text-3xl font-bold">Materi belum bisa dimuat</h1>
        <p className="mt-3 text-muted-foreground">
          Koneksi mungkin sedang terputus. Coba lagi tanpa kehilangan pilihanmu.
        </p>
        <button
          className="mt-7 rounded-full bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-hover"
          onClick={reset}
          type="button"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
