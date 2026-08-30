import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { useRealtimeNouvellesCommandes } from '@/api/realtime';

export function RootLayout() {
  useRealtimeNouvellesCommandes();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
