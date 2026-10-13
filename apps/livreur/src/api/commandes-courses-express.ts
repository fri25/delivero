import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { exigerReseau, useExecuterAction } from './hors-ligne';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeCoursesExpress } from './types';

// Polling safety net: real-time alerts (api/alertes.ts) refresh the lists
// at once, this catches up after a dropped socket on unstable 3G.
const POLL_INTERVAL_MS = 8000;

function invalidateCoursesExpress(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['courses-express-disponibles'] });
  queryClient.invalidateQueries({ queryKey: ['mes-courses-express'] });
}

export function useCoursesExpressDisponibles() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['courses-express-disponibles'],
    queryFn: () =>
      apiFetch<CommandeCoursesExpress[]>('/commandes/courses-express/disponibles', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMesCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-courses-express'],
    queryFn: () =>
      apiFetch<CommandeCoursesExpress[]>('/commandes/courses-express/mes-courses', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function usePrendreEnChargeCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    // Online only (decision of 13/10): the list may be stale offline.
    mutationFn: (id: string) =>
      exigerReseau('Pas de réseau : il faut être connecté pour prendre une course (un autre livreur l’a peut-être déjà prise).', () =>
        apiFetch<CommandeCoursesExpress>(`/commandes/courses-express/${id}/prendre-en-charge`, {
          method: 'PATCH',
          token,
        }),
      ),
    // Même en cas d'échec (409 : déjà pris par un autre livreur), on
    // rafraîchit la liste pour faire disparaître la carte obsolète.
    onSettled: () => invalidateCoursesExpress(queryClient),
  });
}

// Goes through the offline queue (docs/pwa-offline.md).
export function useRealiserEtape() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ commandeId, etapeId }: { commandeId: string; etapeId: string }) =>
      executer({
        libelle: 'Arrêt réalisé',
        service: 'courses_express',
        commandeId,
        methode: 'PATCH',
        chemin: `/commandes/courses-express/${commandeId}/etapes/${etapeId}/realiser`,
        attendu: { etapeId },
      }),
  });
}

export function useDeclarerLitigeCoursesExpress() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      executer({
        libelle: 'Problème signalé',
        service: 'courses_express',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/courses-express/${id}/litige`,
        corps: { motif },
        attendu: { statut: 'litige' },
      }),
  });
}
