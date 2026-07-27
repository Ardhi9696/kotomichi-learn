import { AppNavigation, type AppViewer } from '@/components/app-navigation';

export type { AppViewer } from '@/components/app-navigation';

/** Server boundary: page content stays a Server Component slot inside the interactive navigation. */
export function AppShell({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: AppViewer;
}) {
  return <AppNavigation viewer={viewer}>{children}</AppNavigation>;
}
