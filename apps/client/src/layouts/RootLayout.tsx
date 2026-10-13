import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { useRealtimeCommandeUpdates } from '@/api/realtime';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkStatus } from '@/components/layout/NetworkStatus';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { estPageAvecBarre } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function RootLayout() {
  useRealtimeCommandeUpdates();
  // Pages are lazy-loaded: on slow 3G the previous screen stays up while the
  // next chunk downloads, so signal it.
  const chargement = useNavigation().state === 'loading';
  // Room under the content for the fixed mobile tab bar.
  const avecBarre = estPageAvecBarre(useLocation().pathname);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {chargement && (
        <div
          role="progressbar"
          aria-label="Chargement de la page"
          className="fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-primary"
        />
      )}
      <Header />
      <NetworkStatus />
      <main className={cn('mx-auto w-full max-w-6xl flex-1 px-4 pt-5 md:px-6 md:pt-8 md:pb-12 lg:px-8', avecBarre ? 'pb-24' : 'pb-8')}>
        <Suspense fallback={<div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-32 w-full rounded-2xl" /><Skeleton className="h-56 w-full rounded-2xl" /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}
