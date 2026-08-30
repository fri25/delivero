import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { LivreursPage } from '@/pages/LivreursPage';
import { ZonesPage } from '@/pages/ZonesPage';
import { CaissePage } from '@/pages/CaissePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <OverviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'livreurs',
        element: (
          <ProtectedRoute>
            <LivreursPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'zones',
        element: (
          <ProtectedRoute>
            <ZonesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'caisse',
        element: (
          <ProtectedRoute>
            <CaissePage />
          </ProtectedRoute>
        ),
      },
      { path: 'connexion', element: <LoginPage /> },
    ],
  },
]);
