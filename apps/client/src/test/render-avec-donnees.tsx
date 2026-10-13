import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Adresse, Quartier } from '@/api/types';
import { useAuthStore } from '@/stores/auth-store';

export const QUARTIERS: Quartier[] = [
  { id: 'q-kant', nom: 'Kantaborifa', fraisLivraison: '500.00', autre: false },
  { id: 'q-ourb', nom: 'Ourbouga', fraisLivraison: '1000.00', autre: false },
  { id: 'q-autre', nom: 'Autre quartier', fraisLivraison: '1000.00', autre: true },
];

export const ADRESSE_KANTABORIFA: Adresse = {
  id: 'a-maison',
  libelle: 'Maison',
  quartier: 'Kantaborifa',
  quartierId: 'q-kant',
  quartierTarifaire: QUARTIERS[0],
  pointDeRepere: 'Près du grand marché',
  latitude: null,
  longitude: null,
  estParDefaut: true,
};

/**
 * Renders a page as a signed-in client, with the API answered from fixtures
 * by path. Unknown paths answer 404 so a forgotten call fails loudly.
 */
export function renderAvecDonnees(page: ReactElement, reponses: Record<string, unknown> = {}) {
  useAuthStore.setState({ token: 'jeton', user: { id: 'u1', telephone: '+2290157866959', nom: 'Awa', role: 'client' } });
  const donnees: Record<string, unknown> = {
    '/quartiers': QUARTIERS,
    '/zones': [{ id: 'z1', nom: 'Natitingou' }],
    '/adresses': [ADRESSE_KANTABORIFA],
    '/medias/config': { actif: false },
    ...reponses,
  };
  vi.spyOn(globalThis, 'fetch').mockImplementation((entree) => {
    const chemin = new URL(String(entree), 'http://test').pathname.replace(/^\/api/, '');
    const corps = donnees[chemin];
    return Promise.resolve(
      corps === undefined
        ? new Response('{"message":"Not found"}', { status: 404, headers: { 'Content-Type': 'application/json' } })
        : new Response(JSON.stringify(corps), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
  });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{page}</MemoryRouter>
    </QueryClientProvider>,
  );
}
