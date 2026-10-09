import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { useRealtimeCommandeUpdates } from '@/api/realtime';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkStatus } from '@/components/layout/NetworkStatus';

export function RootLayout() {
  useRealtimeCommandeUpdates();

  return (
    <div className="min-h-screen bg-background">
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
