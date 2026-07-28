'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function CatalogSearchInput({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParamsRef = useRef(searchParams);
  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  useEffect(() => {
    searchParamsRef.current = searchParams;
    pathnameRef.current = pathname;
    routerRef.current = router;
  }, [pathname, router, searchParams]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function updateSearch(nextValue: string) {
    setValue(nextValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (nextValue) params.set('q', nextValue);
      else params.delete('q');
      params.set('page', '1');
      routerRef.current.replace(
        `${pathnameRef.current}?${params.toString()}`,
        { scroll: false },
      );
    }, 300);
  }

  return (
    <div className="relative">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 16 16"
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="m11 11 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      <input
        className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 font-normal placeholder:text-muted-foreground/70 focus:border-primary focus:outline-2"
        onChange={(e) => updateSearch(e.target.value)}
        placeholder="Cari materi … 食べる, たべる, eat…"
        type="search"
        value={value}
      />
    </div>
  );
}
