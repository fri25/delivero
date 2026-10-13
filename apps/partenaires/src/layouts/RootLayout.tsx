import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { useAlarmeCommandes } from '@/api/alarme';
import { useRealtimeNouvellesCommandes } from '@/api/realtime';
import { useAuthStore } from '@/stores/auth-store';

export function RootLayout() {
  const connecte = useAuthStore((state) => Boolean(state.user));
  useRealtimeNouvellesCommandes();
  // Rings on every screen (Menu, Ventes…), not only on Commandes.
  const aAccepter = useAlarmeCommandes();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* pb-28: room for the fixed tab bar. */}
      <main className={connecte ? 'mx-auto max-w-5xl px-4 pt-5 pb-28' : 'mx-auto max-w-5xl px-4 py-6'}>
        <Outlet />
      </main>
      {connecte && <BottomNav aAccepter={aAccepter} />}
      <Toaster position="top-center" />
    </div>
  );
}
