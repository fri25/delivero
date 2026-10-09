import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

const ServicesHubPage = lazy(() => import('@/pages/ServicesHubPage').then((module) => ({ default: module.ServicesHubPage })));
const RepasHomePage = lazy(() => import('@/pages/RepasHomePage').then((module) => ({ default: module.RepasHomePage })));
const RestaurantPage = lazy(() => import('@/pages/RestaurantPage').then((module) => ({ default: module.RestaurantPage })));
const CartPage = lazy(() => import('@/pages/CartPage').then((module) => ({ default: module.CartPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })));
const ColisFormPage = lazy(() => import('@/pages/ColisFormPage').then((module) => ({ default: module.ColisFormPage })));
const ColisOrdersPage = lazy(() => import('@/pages/ColisOrdersPage').then((module) => ({ default: module.ColisOrdersPage })));
const ColisOrderDetailPage = lazy(() => import('@/pages/ColisOrderDetailPage').then((module) => ({ default: module.ColisOrderDetailPage })));
const ColisSuiviPage = lazy(() => import('@/pages/ColisSuiviPage').then((module) => ({ default: module.ColisSuiviPage })));
const EmplettesFormPage = lazy(() => import('@/pages/EmplettesFormPage').then((module) => ({ default: module.EmplettesFormPage })));
const EmplettesOrdersPage = lazy(() => import('@/pages/EmplettesOrdersPage').then((module) => ({ default: module.EmplettesOrdersPage })));
const EmplettesOrderDetailPage = lazy(() => import('@/pages/EmplettesOrderDetailPage').then((module) => ({ default: module.EmplettesOrderDetailPage })));
const CoursesExpressFormPage = lazy(() => import('@/pages/CoursesExpressFormPage').then((module) => ({ default: module.CoursesExpressFormPage })));
const CoursesExpressOrdersPage = lazy(() => import('@/pages/CoursesExpressOrdersPage').then((module) => ({ default: module.CoursesExpressOrdersPage })));
const CoursesExpressOrderDetailPage = lazy(() => import('@/pages/CoursesExpressOrderDetailPage').then((module) => ({ default: module.CoursesExpressOrderDetailPage })));
const HelpPage = lazy(() => import('@/pages/HelpPage').then((module) => ({ default: module.HelpPage })));

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
      { path: 'aide', element: <HelpPage /> },
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
