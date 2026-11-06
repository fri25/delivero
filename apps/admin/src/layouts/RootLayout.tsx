import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import type { User } from '@/api/types';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { useRemboursements } from '@/api/incidents';
import { useAuthStore } from '@/stores/auth-store';

/**
 * A session saved before étape 8 has no permissions: reload the profile once
 * so that the menu shows the screens of the actual role.
 */
function useProfilAJour() {
  const token = useAuthStore((state) => state.token);
  const sansPermissions = useAuthStore((state) => state.user !== null && state.user.permissions === undefined);
  const login = useAuthStore((state) => state.login);
  useEffect(() => {
    if (!token || !sansPermissions) return;
    apiFetch<User>('/auth/me', { token })
      .then((profil) => login(token, profil))
      .catch(() => undefined);
  }, [token, sansPermissions, login]);
}

export function RootLayout() {
  const connecte = useAuthStore((state) => Boolean(state.token));
  useProfilAJour();
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
