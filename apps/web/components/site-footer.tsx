import { BrandMark } from '@/components/brand-mark';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="flex items-center gap-3 font-semibold">
            <BrandMark />
            Kotomichi Learn
          </div>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Materi resmi © Kotomichi. Penerbit deck publik wajib memiliki hak atas
            seluruh konten yang dibagikan.
          </p>
        </div>
        <p className="text-sm font-medium">© Kotomichi</p>
      </div>
    </footer>
  );
}
