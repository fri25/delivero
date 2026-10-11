import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

/** Wraps `children`, or used as a layout route guarding its child routes. */
export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  return children ?? <Outlet />;
}
