import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { LivreursPage } from '@/pages/LivreursPage';
import { ZonesPage } from '@/pages/ZonesPage';
import { QuartiersPage } from '@/pages/QuartiersPage';
import { CaissePage } from '@/pages/CaissePage';
import { SaisieManuellePage } from '@/pages/SaisieManuellePage';
import { TableauDeBordPage } from '@/pages/TableauDeBordPage';
import { RemboursementsPage } from '@/pages/RemboursementsPage';
import { RestaurantsPage } from '@/pages/RestaurantsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <TableauDeBordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'commandes',
        element: (
          <ProtectedRoute>
            <OverviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'remboursements',
        element: (
          <ProtectedRoute>
            <RemboursementsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'restaurants',
        element: (
          <ProtectedRoute>
            <RestaurantsPage />
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
        path: 'quartiers',
        element: (
          <ProtectedRoute>
            <QuartiersPage />
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
      {
        path: 'saisie-manuelle',
        element: (
          <ProtectedRoute>
            <SaisieManuellePage />
          </ProtectedRoute>
        ),
      },
      { path: 'connexion', element: <LoginPage /> },
    ],
  },
]);
