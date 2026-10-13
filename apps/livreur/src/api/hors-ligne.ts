import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, apiFetch } from './client';
import {
  ErreurReseau,
  ErreurServeur,
  rejouer,
  statutAtteint,
  type ActionEnFile,
} from '@/lib/rejeu';
import type { ServiceLivreur } from '@/lib/taches';
import { useAuthStore } from '@/stores/auth-store';
import { useFileActionsStore } from '@/stores/file-actions-store';

// The livreur's own orders, per service: what the queue updates locally and
// what a replay checks against (docs/pwa-offline.md).
const MES_COMMANDES: Record<ServiceLivreur, { cle: string; chemin: string }> = {
  repas: { cle: 'mes-courses', chemin: '/commandes/repas/mes-courses' },
  colis: { cle: 'mes-colis', chemin: '/commandes/colis/mes-courses' },
  courses_express: { cle: 'mes-courses-express', chemin: '/commandes/courses-express/mes-courses' },
  emplettes: { cle: 'mes-emplettes', chemin: '/commandes/emplettes/mes-courses' },
};

const DISPONIBLES = ['courses-disponibles', 'colis-disponibles', 'courses-express-disponibles', 'emplettes-disponibles'];

export type SpecAction = Omit<ActionEnFile, 'id' | 'userId' | 'creeLe' | 'erreur'>;

interface CommandeLocale {
  id: string;
  statut: string;
  etapes?: { id: string; realisee: boolean }[];
}

/** Shows the queued action as done in the lists, without waiting for the server. */
function appliquerLocalement(queryClient: QueryClient, action: SpecAction) {
  queryClient.setQueryData<CommandeLocale[]>([MES_COMMANDES[action.service].cle], (liste) =>
    liste?.map((commande) => {
      if (commande.id !== action.commandeId) return commande;
      const { statut, etapeId } = action.attendu;
      return {
        ...commande,
        ...(statut ? { statut } : {}),
        ...(etapeId && commande.etapes
          ? { etapes: commande.etapes.map((etape) => (etape.id === etapeId ? { ...etape, realisee: true } : etape)) }
          : {}),
      };
    }),
  );
}

function rafraichirTout(queryClient: QueryClient) {
  for (const { cle } of Object.values(MES_COMMANDES)) void queryClient.invalidateQueries({ queryKey: [cle] });
  for (const cle of DISPONIBLES) void queryClient.invalidateQueries({ queryKey: [cle] });
}

/**
 * Sends a livreur action, or queues it when there is no network (or when an
 * earlier action of the same order is still queued: order matters).
 * Resolves either way; rejects only on a real server refusal while online.
 */
async function executerAction(queryClient: QueryClient, spec: SpecAction): Promise<'envoyee' | 'en-file'> {
  const { token, user } = useAuthStore.getState();
  const file = useFileActionsStore.getState();
  const dejaEnFile = file.actions.some(
    (action) => action.service === spec.service && action.commandeId === spec.commandeId,
  );

  if (navigator.onLine && !dejaEnFile) {
    try {
      await apiFetch(spec.chemin, { method: spec.methode, body: spec.corps, token });
      rafraichirTout(queryClient);
      return 'envoyee';
    } catch (error) {
      if (!(error instanceof ErreurReseau)) throw error;
    }
  }

  file.ajouter({
    ...spec,
    id: crypto.randomUUID(),
    userId: user?.id ?? '',
    creeLe: new Date().toISOString(),
  });
  appliquerLocalement(queryClient, spec);
  toast.info(`Pas de réseau : « ${spec.libelle} » est enregistré et partira dès le retour du réseau.`);
  return 'en-file';
}

/** For mutation hooks: `mutationFn: (…) => executer({ … })`. */
export function useExecuterAction() {
  const queryClient = useQueryClient();
  return useCallback((spec: SpecAction) => executerAction(queryClient, spec), [queryClient]);
}

/**
 * Actions that need the server's answer now (decision of 13/10: taking a
 * course is blocked offline — the list may be stale and someone else may
 * have taken it).
 */
export async function exigerReseau<T>(message: string, requete: () => Promise<T>): Promise<T> {
  if (!navigator.onLine) throw new Error(message);
  try {
    return await requete();
  } catch (error) {
    if (error instanceof ErreurReseau) throw new Error(message);
    throw error;
  }
}

let synchroEnCours = false;

/** Replays the queue of the signed-in livreur, in order. */
export async function synchroniser(queryClient: QueryClient) {
  const { token, user } = useAuthStore.getState();
  const file = useFileActionsStore.getState();
  const aRejouer = file.actions.filter((action) => action.userId === user?.id && !action.erreur);
  if (synchroEnCours || !token || !user || aRejouer.length === 0 || !navigator.onLine) return;

  synchroEnCours = true;
  file.setSynchronisation(true);
  try {
    const resultat = await rejouer(
      file.actions.filter((action) => action.userId === user.id),
      async (action) => {
        try {
          await apiFetch(action.chemin, { method: action.methode, body: action.corps, token });
        } catch (error) {
          if (error instanceof ApiError) throw new ErreurServeur(error.statusCode, error.message);
          throw error;
        }
      },
      async (action) => {
        const liste = await apiFetch<CommandeLocale[]>(MES_COMMANDES[action.service].chemin, { token });
        const commande = liste.find((c) => c.id === action.commandeId);
        if (!commande) return false;
        if (action.attendu.etapeId) {
          return Boolean(commande.etapes?.find((etape) => etape.id === action.attendu.etapeId)?.realisee);
        }
        return action.attendu.statut ? statutAtteint(action.service, commande.statut, action.attendu.statut) : false;
      },
    );
    const store = useFileActionsStore.getState();
    store.retirer(resultat.reussies);
    store.marquerRefusees(resultat.refusees);
    if (resultat.reussies.length > 0 || resultat.refusees.length > 0) rafraichirTout(queryClient);
    if (resultat.reussies.length > 0 && resultat.refusees.length === 0) {
      toast.success(
        `Synchronisé : ${resultat.reussies.length} action${resultat.reussies.length > 1 ? 's' : ''} envoyée${resultat.reussies.length > 1 ? 's' : ''}.`,
      );
    }
    if (resultat.refusees.length > 0) {
      toast.error(
        `${resultat.refusees.length} action${resultat.refusees.length > 1 ? 's' : ''} refusée${resultat.refusees.length > 1 ? 's' : ''} par le serveur : voir le bandeau en haut.`,
      );
    }
  } finally {
    synchroEnCours = false;
    useFileActionsStore.getState().setSynchronisation(false);
  }
}

function abonnerReseau(rappel: () => void) {
  window.addEventListener('online', rappel);
  window.addEventListener('offline', rappel);
  return () => {
    window.removeEventListener('online', rappel);
    window.removeEventListener('offline', rappel);
  };
}

export function useEnLigne(): boolean {
  return useSyncExternalStore(abonnerReseau, () => navigator.onLine);
}

/**
 * Mounted once (RootLayout): loads the saved queue, replays it on start, when
 * the network comes back, and every 20 s while something is still waiting.
 */
export function useSynchronisation() {
  const queryClient = useQueryClient();
  const enLigne = useEnLigne();
  const enAttente = useFileActionsStore((state) => state.actions.some((action) => !action.erreur));

  useEffect(() => {
    void useFileActionsStore
      .getState()
      .charger()
      .then(() => synchroniser(queryClient));
  }, [queryClient]);

  useEffect(() => {
    if (!enLigne || !enAttente) return;
    void synchroniser(queryClient);
    const minuterie = window.setInterval(() => void synchroniser(queryClient), 20_000);
    return () => window.clearInterval(minuterie);
  }, [enLigne, enAttente, queryClient]);
}
