import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeRepas } from './types';

// Pas de WebSocket ni de notification push in-app à ce stade (voir
// docs/architecture.md) : on rafraîchit la liste par intervalle en attendant.
const POLL_INTERVAL_MS = 8000;

export function useMesCommandes() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['restaurant-commandes'],
    queryFn: () => apiFetch<CommandeRepas[]>('/restaurants/me/commandes', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

function useCommandeAction(action: string, method: 'PATCH' = 'PATCH') {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeRepas>(`/commandes/repas/${id}/${action}`, { method, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] }),
  });
}

export function useAccepterCommande() {
  return useCommandeAction('accepter');
}

export function useMarquerEnPreparation() {
  return useCommandeAction('preparation');
}

export function useMarquerPrete() {
  return useCommandeAction('prete');
}

export function useRefuserCommande() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      apiFetch<CommandeRepas>(`/commandes/repas/${id}/refuser`, { method: 'PATCH', body: { motif }, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-commandes'] }),
  });
}
