import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader initialTheme="system" isAuthenticated={false} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
