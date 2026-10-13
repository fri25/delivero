import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { useRemboursements } from '@/api/incidents';
import { useAuthStore } from '@/stores/auth-store';

export function RootLayout() {
  const connecte = useAuthStore((state) => Boolean(state.token));
  // Pending refunds show as a badge in the menu, on every screen.
  const { data: remboursements } = useRemboursements();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {connecte ? (
        <div className="mx-auto max-w-7xl px-4 py-5 lg:flex lg:gap-8">
          <Navigation aRembourser={remboursements?.aRembourser.length ?? 0} />
          <main className="min-w-0 flex-1 pt-4 lg:pt-0">
            <Outlet />
          </main>
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </main>
      )}
      <Toaster position="top-center" />
    </div>
  );
}
