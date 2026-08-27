import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeCoursesExpress } from './types';

// Pas de WebSocket ni de notification push in-app à ce stade (voir
// docs/architecture.md) : on rafraîchit par intervalle en attendant.
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
    mutationFn: (id: string) =>
      apiFetch<CommandeCoursesExpress>(`/commandes/courses-express/${id}/prendre-en-charge`, {
        method: 'PATCH',
        token,
      }),
    // Même en cas d'échec (409 : déjà pris par un autre livreur), on
    // rafraîchit la liste pour faire disparaître la carte obsolète.
    onSettled: () => invalidateCoursesExpress(queryClient),
  });
}

export function useRealiserEtape() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commandeId, etapeId }: { commandeId: string; etapeId: string }) =>
      apiFetch<CommandeCoursesExpress>(
        `/commandes/courses-express/${commandeId}/etapes/${etapeId}/realiser`,
        { method: 'PATCH', token },
      ),
    onSuccess: () => invalidateCoursesExpress(queryClient),
  });
}

export function useDeclarerLitigeCoursesExpress() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      apiFetch<CommandeCoursesExpress>(`/commandes/courses-express/${id}/litige`, {
        method: 'PATCH',
        body: { motif },
        token,
      }),
    onSuccess: () => invalidateCoursesExpress(queryClient),
  });
}
