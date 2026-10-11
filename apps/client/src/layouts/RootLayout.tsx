import { Outlet, useNavigation } from 'react-router-dom';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { useRealtimeCommandeUpdates } from '@/api/realtime';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkStatus } from '@/components/layout/NetworkStatus';

export function RootLayout() {
  useRealtimeCommandeUpdates();
  // Pages are lazy-loaded: on slow 3G the previous screen stays up while the
  // next chunk downloads, so signal it.
  const chargement = useNavigation().state === 'loading';

  return (
    <div className="min-h-screen bg-background">
      {chargement && (
        <div
          role="progressbar"
          aria-label="Chargement de la page"
          className="fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-primary"
        />
      )}
      <Header />
      <NetworkStatus />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-32 w-full rounded-2xl" /><Skeleton className="h-56 w-full rounded-2xl" /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
