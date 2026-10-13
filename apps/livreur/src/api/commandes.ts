import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { exigerReseau, useExecuterAction } from './hors-ligne';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeRepas } from './types';

// Polling safety net: real-time alerts (api/alertes.ts) refresh the lists
// at once, this catches up after a dropped socket on unstable 3G.
const POLL_INTERVAL_MS = 8000;

export function useCoursesDisponibles() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['courses-disponibles'],
    queryFn: () => apiFetch<CommandeRepas[]>('/commandes/repas/disponibles', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMesCourses() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-courses'],
    queryFn: () => apiFetch<CommandeRepas[]>('/commandes/repas/mes-courses', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function usePrendreEnCharge() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    // Online only (decision of 13/10): the list may be stale offline.
    mutationFn: (id: string) =>
      exigerReseau('Pas de réseau : il faut être connecté pour prendre une course (un autre livreur l’a peut-être déjà prise).', () =>
        apiFetch<CommandeRepas>(`/commandes/repas/${id}/prendre-en-charge`, { method: 'PATCH', token }),
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['courses-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['mes-courses'] });
    },
  });
}

// Status updates go through the offline queue (docs/pwa-offline.md).
export function useMarquerEnRoute() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (id: string) =>
      executer({
        libelle: 'Repas en route',
        service: 'repas',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/repas/${id}/en-route`,
        attendu: { statut: 'en_route' },
      }),
  });
}

export function useMarquerLivree() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (id: string) =>
      executer({
        libelle: 'Repas livré',
        service: 'repas',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/repas/${id}/livree`,
        attendu: { statut: 'livree' },
      }),
  });
}
