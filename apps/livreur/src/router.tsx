import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { APrendrePage } from '@/pages/APrendrePage';
import { EnCoursPage } from '@/pages/EnCoursPage';
import { HistoriquePage } from '@/pages/HistoriquePage';
import { PortefeuillePage } from '@/pages/PortefeuillePage';

// Former per-service pages (before 13/10): kept as redirects so bookmarks and
// installed shortcuts still land somewhere useful.
const ANCIENNES_LISTES = ['colis', 'emplettes', 'courses-express'];
const ANCIENNES_MIENNES = ['mes-courses', 'colis/mes-courses', 'emplettes/mes-courses', 'courses-express/mes-courses'];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <APrendrePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'en-cours',
        element: (
          <ProtectedRoute>
            <EnCoursPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'historique',
        element: (
          <ProtectedRoute>
            <HistoriquePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'portefeuille',
        element: (
          <ProtectedRoute>
            <PortefeuillePage />
          </ProtectedRoute>
        ),
      },
      ...ANCIENNES_LISTES.map((path) => ({ path, element: <Navigate to="/" replace /> })),
      ...ANCIENNES_MIENNES.map((path) => ({ path, element: <Navigate to="/en-cours" replace /> })),
      { path: 'connexion', element: <LoginPage /> },
    ],
  },
]);
