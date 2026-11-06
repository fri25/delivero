import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usePeut } from '@/lib/permissions';

/**
 * Signed-in screens. `permission`: the screen is not for every
 * back-office role (étape 8); the API refuses anyway, this only avoids a
 * page of errors.
 */
export function ProtectedRoute({ children, permission }: { children: ReactNode; permission?: string }) {
  const token = useAuthStore((state) => state.token);
  const peut = usePeut();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (permission && !peut(permission)) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-border/70 bg-card p-6 text-center shadow-xs space-y-2">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="font-heading text-lg font-bold text-foreground">Accès non autorisé</h1>
        <p className="text-sm text-muted-foreground">
          Votre rôle ne donne pas accès à cet écran. Demandez à un administrateur de l’entreprise si vous en avez besoin.
        </p>
      </div>
    );
  }

  return children;
}
