import type { ComponentType } from 'react';
import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ServicesHubPage } from '@/pages/ServicesHubPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

// Only the home page ships in the entry bundle (JS budget on 3G, see
// docs/exigences-non-fonctionnelles.md): every other page is its own chunk,
// downloaded when first visited.
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return async () => ({ Component: (await load())[name] });
}

// Emplettes hors périmètre V1 : routes non déclarées tant qu'EMPLETTES_ACTIF
// est faux, donc inatteignables. Leurs chunks sont tout de même émis par le
// bundler (import() dynamique) mais exclus du précache du service worker
// (globIgnores dans vite.config.ts) : jamais téléchargés. Des imports
// statiques les élimineraient, mais leurs dépendances (Radix Select,
// floating-ui) resteraient alors dans le bundle d'entrée.
const emplettesPubliques: RouteObject[] = EMPLETTES_ACTIF
  ? [{ path: 'emplettes', lazy: page(() => import('@/pages/EmplettesFormPage'), 'EmplettesFormPage') }]
  : [];
const emplettesProtegees: RouteObject[] = EMPLETTES_ACTIF
  ? [
      {
        path: 'emplettes/commandes',
        lazy: page(() => import('@/pages/EmplettesOrdersPage'), 'EmplettesOrdersPage'),
      },
      {
        path: 'emplettes/commandes/:id',
        lazy: page(() => import('@/pages/EmplettesOrderDetailPage'), 'EmplettesOrderDetailPage'),
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <ServicesHubPage /> },
      { path: 'repas', lazy: page(() => import('@/pages/RepasHomePage'), 'RepasHomePage') },
      { path: 'restaurants/:id', lazy: page(() => import('@/pages/RestaurantPage'), 'RestaurantPage') },
      { path: 'panier', lazy: page(() => import('@/pages/CartPage'), 'CartPage') },
      { path: 'colis', lazy: page(() => import('@/pages/ColisFormPage'), 'ColisFormPage') },
      // Public, sans authentification (suivi destinataire).
      { path: 'colis/suivi/:id', lazy: page(() => import('@/pages/ColisSuiviPage'), 'ColisSuiviPage') },
      {
        path: 'courses-express',
        lazy: page(() => import('@/pages/CoursesExpressFormPage'), 'CoursesExpressFormPage'),
      },
      ...emplettesPubliques,
      // F-CLI-02 : suivi d'une commande sans compte, par lien signé (public).
      { path: 'suivi/:jeton', lazy: page(() => import('@/pages/SuiviInvitePage'), 'SuiviInvitePage') },
      {
        path: 'suivi/:jeton/paiement',
        lazy: page(() => import('@/pages/PaiementRetourInvitePage'), 'PaiementRetourInvitePage'),
      },
      { path: 'connexion', lazy: page(() => import('@/pages/LoginPage'), 'LoginPage') },
      { path: 'inscription', lazy: page(() => import('@/pages/RegisterPage'), 'RegisterPage') },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'commandes', lazy: page(() => import('@/pages/OrdersPage'), 'OrdersPage') },
          { path: 'commandes/:id', lazy: page(() => import('@/pages/OrderDetailPage'), 'OrderDetailPage') },
          { path: 'adresses', lazy: page(() => import('@/pages/AdressesPage'), 'AdressesPage') },
          {
            path: 'colis/commandes',
            lazy: page(() => import('@/pages/ColisOrdersPage'), 'ColisOrdersPage'),
          },
          {
            path: 'colis/commandes/:id',
            lazy: page(() => import('@/pages/ColisOrderDetailPage'), 'ColisOrderDetailPage'),
          },
          {
            path: 'courses-express/commandes',
            lazy: page(() => import('@/pages/CoursesExpressOrdersPage'), 'CoursesExpressOrdersPage'),
          },
          {
            path: 'courses-express/commandes/:id',
            lazy: page(() => import('@/pages/CoursesExpressOrderDetailPage'), 'CoursesExpressOrderDetailPage'),
          },
          ...emplettesProtegees,
          // FedaPay return URL (callback_url set by the API).
          {
            path: 'paiement/retour/:commandeId',
            lazy: page(() => import('@/pages/PaiementRetourPage'), 'PaiementRetourPage'),
          },
        ],
      },
      { path: '*', lazy: page(() => import('@/pages/NotFoundPage'), 'NotFoundPage') },
    ],
  },
]);
