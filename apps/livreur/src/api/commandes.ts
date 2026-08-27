import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeRepas } from './types';

// Pas de WebSocket ni de notification push in-app à ce stade (voir
// docs/architecture.md) : on rafraîchit par intervalle en attendant.
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

function useCourseAction(action: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeRepas>(`/commandes/repas/${id}/${action}`, { method: 'PATCH', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['mes-courses'] });
    },
  });
}

export function usePrendreEnCharge() {
  return useCourseAction('prendre-en-charge');
}

export function useMarquerEnRoute() {
  return useCourseAction('en-route');
}

export function useMarquerLivree() {
  return useCourseAction('livree');
}
