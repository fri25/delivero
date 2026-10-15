import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { exigerReseau, useExecuterAction } from './hors-ligne';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeColis } from './types';

// Polling safety net: real-time alerts (api/alertes.ts) refresh the lists
// at once, this catches up after a dropped socket on unstable 3G.
const POLL_INTERVAL_MS = 8000;

function invalidateColis(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['colis-disponibles'] });
  queryClient.invalidateQueries({ queryKey: ['mes-colis'] });
}

export function useColisDisponibles() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['colis-disponibles'],
    queryFn: () => apiFetch<CommandeColis[]>('/commandes/colis/disponibles', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMesColis() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-colis'],
    queryFn: () => apiFetch<CommandeColis[]>('/commandes/colis/mes-courses', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function usePrendreEnChargeColis() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    // Online only (decision of 13/10): the list may be stale offline.
    mutationFn: (id: string) =>
      exigerReseau('Pas de réseau : il faut être connecté pour prendre une course (un autre livreur l’a peut-être déjà prise).', () =>
        apiFetch<CommandeColis>(`/commandes/colis/${id}/prendre-en-charge`, { method: 'PATCH', token }),
      ),
    // Même en cas d'échec (409 : déjà pris par un autre livreur), on
    // rafraîchit la liste pour faire disparaître la carte obsolète.
    onSettled: () => invalidateColis(queryClient),
  });
}

export interface RecupererColisInput {
  id: string;
  photoEnlevementUrl?: string;
  etatEnlevement?: string;
}

// Status updates go through the offline queue (docs/pwa-offline.md).
export function useMarquerColisRecupere() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (input: string | RecupererColisInput) => {
      const id = typeof input === 'string' ? input : input.id;
      const corps =
        typeof input === 'object'
          ? {
              photoEnlevementUrl: input.photoEnlevementUrl,
              etatEnlevement: input.etatEnlevement,
            }
          : undefined;
      return executer({
        libelle: 'Colis récupéré',
        service: 'colis',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/colis/${id}/recupere`,
        corps,
        attendu: { statut: 'colis_recupere' },
      });
    },
  });
}

export function useMarquerColisEnRoute() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (id: string) =>
      executer({
        libelle: 'Colis en route',
        service: 'colis',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/colis/${id}/en-route`,
        attendu: { statut: 'en_route' },
      }),
  });
}

interface LivrerColisInput {
  id: string;
  codeOtp: string;
  nomReceptionnaire?: string;
  montantEncaisse?: number;
  photoPreuveUrl?: string;
}

// Queued offline too (decision of 13/10): the delivery code is checked by
// the server at sync time; a wrong code shows up as a refused action.
export function useLivrerColis() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ id, ...dto }: LivrerColisInput) =>
      executer({
        libelle: 'Colis remis',
        service: 'colis',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/colis/${id}/livraison`,
        corps: dto,
        attendu: { statut: 'livre' },
      }),
  });
}

export function useDeclarerLitigeColis() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      executer({
        libelle: 'Problème signalé',
        service: 'colis',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/colis/${id}/litige`,
        corps: { motif },
        attendu: { statut: 'litige' },
      }),
  });
}
