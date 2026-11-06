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
import { ClientsPage } from '@/pages/ClientsPage';
import { UtilisateursPage } from '@/pages/UtilisateursPage';
import { JournalPage } from '@/pages/JournalPage';
import { ReglagesPage } from '@/pages/ReglagesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute permission="statistiques.consulter_tout">
            <TableauDeBordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'commandes',
        element: (
          <ProtectedRoute permission="commandes.consulter_toutes">
            <OverviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'remboursements',
        element: (
          <ProtectedRoute permission="paiements.rembourser">
            <RemboursementsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'restaurants',
        element: (
          <ProtectedRoute permission="partenaires.gerer">
            <RestaurantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'livreurs',
        element: (
          <ProtectedRoute permission="livreurs.gerer">
            <LivreursPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'zones',
        element: (
          <ProtectedRoute permission="zones.gerer">
            <ZonesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quartiers',
        element: (
          <ProtectedRoute permission="zones.gerer">
            <QuartiersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'caisse',
        element: (
          <ProtectedRoute permission="caisse.rapprocher">
            <CaissePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'saisie-manuelle',
        element: (
          <ProtectedRoute permission="commandes.saisir_manuelle">
            <SaisieManuellePage />
          </ProtectedRoute>
        ),
      },
      // Étape 8: the company's own space.
      {
        path: 'clients',
        element: (
          <ProtectedRoute permission="clients.consulter">
            <ClientsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'utilisateurs',
        element: (
          <ProtectedRoute permission="entreprise.utilisateurs">
            <UtilisateursPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal',
        element: (
          <ProtectedRoute permission="journal.consulter">
            <JournalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reglages',
        element: (
          <ProtectedRoute permission="entreprise.parametres">
            <ReglagesPage />
          </ProtectedRoute>
        ),
      },
      { path: 'connexion', element: <LoginPage /> },
    ],
  },
]);
