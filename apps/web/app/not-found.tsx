import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 py-20 text-center">
      <div>
        <p className="font-serif text-8xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-serif text-3xl font-bold">Jalannya belum ditemukan</h1>
        <p className="mt-3 text-muted-foreground">
          Materi mungkin sudah berpindah atau tidak termasuk snapshot OpenJLPT aktif.
        </p>
        <Link
          className="mt-7 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
          href="/catalog"
        >
          Kembali ke katalog
        </Link>
      </div>
    </div>
  );
}
