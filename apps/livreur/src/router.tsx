import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { CoursesDisponiblesPage } from '@/pages/CoursesDisponiblesPage';
import { MesCoursesPage } from '@/pages/MesCoursesPage';
import { ColisDisponiblesPage } from '@/pages/ColisDisponiblesPage';
import { MesColisPage } from '@/pages/MesColisPage';
import { EmplettesDisponiblesPage } from '@/pages/EmplettesDisponiblesPage';
import { MesEmplettesPage } from '@/pages/MesEmplettesPage';
import { CoursesExpressDisponiblesPage } from '@/pages/CoursesExpressDisponiblesPage';
import { MesCoursesExpressPage } from '@/pages/MesCoursesExpressPage';
import { PortefeuillePage } from '@/pages/PortefeuillePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <CoursesDisponiblesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-courses',
        element: (
          <ProtectedRoute>
            <MesCoursesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'colis',
        element: (
          <ProtectedRoute>
            <ColisDisponiblesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'colis/mes-courses',
        element: (
          <ProtectedRoute>
            <MesColisPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'emplettes',
        element: (
          <ProtectedRoute>
            <EmplettesDisponiblesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'emplettes/mes-courses',
        element: (
          <ProtectedRoute>
            <MesEmplettesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses-express',
        element: (
          <ProtectedRoute>
            <CoursesExpressDisponiblesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses-express/mes-courses',
        element: (
          <ProtectedRoute>
            <MesCoursesExpressPage />
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
      { path: 'connexion', element: <LoginPage /> },
    ],
  },
]);
