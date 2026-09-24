import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ServicesHubPage } from '@/pages/ServicesHubPage';
import { RepasHomePage } from '@/pages/RepasHomePage';
import { RestaurantPage } from '@/pages/RestaurantPage';
import { CartPage } from '@/pages/CartPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { ColisFormPage } from '@/pages/ColisFormPage';
import { ColisOrdersPage } from '@/pages/ColisOrdersPage';
import { ColisOrderDetailPage } from '@/pages/ColisOrderDetailPage';
import { ColisSuiviPage } from '@/pages/ColisSuiviPage';
import { EmplettesFormPage } from '@/pages/EmplettesFormPage';
import { EmplettesOrdersPage } from '@/pages/EmplettesOrdersPage';
import { EmplettesOrderDetailPage } from '@/pages/EmplettesOrderDetailPage';
import { CoursesExpressFormPage } from '@/pages/CoursesExpressFormPage';
import { CoursesExpressOrdersPage } from '@/pages/CoursesExpressOrdersPage';
import { CoursesExpressOrderDetailPage } from '@/pages/CoursesExpressOrderDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <ServicesHubPage /> },
      { path: 'repas', element: <RepasHomePage /> },
      { path: 'colis', element: <ColisFormPage /> },
      {
        path: 'colis/commandes',
        element: (
          <ProtectedRoute>
            <ColisOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'colis/commandes/:id',
        element: (
          <ProtectedRoute>
            <ColisOrderDetailPage />
          </ProtectedRoute>
        ),
      },
      // Public, sans authentification (suivi destinataire) : ne pas envelopper
      // dans ProtectedRoute.
      { path: 'colis/suivi/:id', element: <ColisSuiviPage /> },
      { path: 'courses-express', element: <CoursesExpressFormPage /> },
      {
        path: 'courses-express/commandes',
        element: (
          <ProtectedRoute>
            <CoursesExpressOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses-express/commandes/:id',
        element: (
          <ProtectedRoute>
            <CoursesExpressOrderDetailPage />
          </ProtectedRoute>
        ),
      },
      // Emplettes hors périmètre V1 : le code des écrans reste dans le dépôt,
      // mais comme EMPLETTES_ACTIF est une constante fausse, le bundler élimine
      // entièrement cette branche du build (voir packages/config/perimetre-v1.ts).
      ...(EMPLETTES_ACTIF
        ? [
            { path: 'emplettes', element: <EmplettesFormPage /> },
            {
              path: 'emplettes/commandes',
              element: (
                <ProtectedRoute>
                  <EmplettesOrdersPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'emplettes/commandes/:id',
              element: (
                <ProtectedRoute>
                  <EmplettesOrderDetailPage />
                </ProtectedRoute>
              ),
            },
          ]
        : []),
      { path: 'restaurants/:id', element: <RestaurantPage /> },
      { path: 'panier', element: <CartPage /> },
      { path: 'connexion', element: <LoginPage /> },
      { path: 'inscription', element: <RegisterPage /> },
      {
        path: 'commandes',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'commandes/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
