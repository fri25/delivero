import { Outlet, useNavigation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { useRealtimeCommandeUpdates } from '@/api/realtime';

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
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
