import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/auth-store';
import { useAlertesLivreur } from '@/api/alertes';
import { useSynchronisation } from '@/api/hors-ligne';
import { BandeauReseau } from '@/components/layout/BandeauReseau';

export function RootLayout() {
  const connecte = useAuthStore((state) => Boolean(state.user));
  // New / assigned courses, in real time (refresh + toast + vibration).
  useAlertesLivreur();
  // Offline queue: loaded on start, replayed when the network is back.
  useSynchronisation();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {connecte && <BandeauReseau />}
      {/* pb-28: room for the fixed tab bar. */}
      <main className={connecte ? 'mx-auto max-w-3xl px-4 pt-5 pb-28' : 'mx-auto max-w-3xl px-4 py-6'}>
        <Outlet />
      </main>
      {connecte && <BottomNav />}
      <Toaster position="top-center" />
    </div>
  );
}
