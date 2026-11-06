import { createBrowserRouter } from 'react-router-dom';
import { Coquille } from '@/components/layout/Coquille';
import { ConnexionPage } from '@/pages/ConnexionPage';
import { EntreprisesPage } from '@/pages/EntreprisesPage';
import { EntreprisePage } from '@/pages/EntreprisePage';
import { NouvelleEntreprisePage } from '@/pages/NouvelleEntreprisePage';
import { JournalPage } from '@/pages/JournalPage';

export const router = createBrowserRouter([
  { path: '/connexion', element: <ConnexionPage /> },
  {
    path: '/',
    element: <Coquille />,
    children: [
      { index: true, element: <EntreprisesPage /> },
      { path: 'entreprises/nouvelle', element: <NouvelleEntreprisePage /> },
      { path: 'entreprises/:id', element: <EntreprisePage /> },
      { path: 'journal', element: <JournalPage /> },
    ],
  },
]);
