import { dehydrate, hydrate, type DehydratedState, type QueryClient } from '@tanstack/react-query';
import { ecrire, lire } from '@/lib/stockage-local';
import { useAuthStore } from '@/stores/auth-store';

// Last known lists, kept on the phone (docs/pwa-offline.md: stale-while-
// revalidate, persisted): opened without network, the app shows them
// instead of an empty screen, then refreshes as soon as it can.

const CLE = 'cache-requetes';
const DUREE_MAX_MS = 24 * 60 * 60 * 1000;

const PERSISTEES = new Set([
  'courses-disponibles',
  'colis-disponibles',
  'courses-express-disponibles',
  'emplettes-disponibles',
  'mes-courses',
  'mes-colis',
  'mes-courses-express',
  'mes-emplettes',
  'mon-profil-livreur',
  'mon-portefeuille-livreur',
  'mon-recap-journalier',
]);

interface CacheEnregistre {
  userId: string;
  sauveLe: number;
  etat: DehydratedState;
}

/** Called once before the first render. Only the same account's data, < 24 h. */
export async function restaurerCache(queryClient: QueryClient): Promise<void> {
  const enregistre = await lire<CacheEnregistre>(CLE);
  const userId = useAuthStore.getState().user?.id;
  if (!enregistre || !userId || enregistre.userId !== userId) return;
  if (Date.now() - enregistre.sauveLe > DUREE_MAX_MS) return;
  hydrate(queryClient, enregistre.etat);
}

/** Saves the lists (debounced) whenever the cache changes. */
export function sauvegarderCache(queryClient: QueryClient): () => void {
  let minuterie: number | undefined;
  return queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(minuterie);
    minuterie = window.setTimeout(() => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;
      const etat = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) =>
          query.state.status === 'success' && PERSISTEES.has(String(query.queryKey[0])),
      });
      void ecrire(CLE, { userId, sauveLe: Date.now(), etat } satisfies CacheEnregistre);
    }, 1000);
  });
}
