import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeEmplettes, StatutArticleEmplette } from './types';

// Pas de WebSocket ni de notification push in-app à ce stade (voir
// docs/architecture.md) : on rafraîchit par intervalle en attendant.
const POLL_INTERVAL_MS = 8000;

function invalidateEmplettes(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['emplettes-disponibles'] });
  queryClient.invalidateQueries({ queryKey: ['mes-emplettes'] });
}

export function useEmplettesDisponibles() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['emplettes-disponibles'],
    queryFn: () => apiFetch<CommandeEmplettes[]>('/commandes/emplettes/disponibles', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMesEmplettes() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-emplettes'],
    queryFn: () => apiFetch<CommandeEmplettes[]>('/commandes/emplettes/mes-courses', { token }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function usePrendreEnChargeEmplettes() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/prendre-en-charge`, {
        method: 'PATCH',
        token,
      }),
    // Même en cas d'échec (409 : déjà pris par un autre livreur), on
    // rafraîchit la liste pour faire disparaître la carte obsolète.
    onSettled: () => invalidateEmplettes(queryClient),
  });
}

interface PointerArticleInput {
  commandeId: string;
  articleId: string;
  statut: Exclude<StatutArticleEmplette, 'en_attente'>;
  prixReel?: number;
  produitRemplacementLibelle?: string;
}

export function usePointerArticle() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commandeId, articleId, ...dto }: PointerArticleInput) =>
      apiFetch<CommandeEmplettes>(
        `/commandes/emplettes/${commandeId}/articles/${articleId}/pointer`,
        { method: 'PATCH', body: dto, token },
      ),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}

export function useTerminerAchats() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recapitulatifAchats }: { id: string; recapitulatifAchats: string }) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/achats-termines`, {
        method: 'PATCH',
        body: { recapitulatifAchats },
        token,
      }),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}

export function useMarquerEmplettesEnRoute() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/en-route`, { method: 'PATCH', token }),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}

export function useMarquerEmplettesLivree() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/livree`, { method: 'PATCH', token }),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}

export function useDeclarerLitigeEmplettes() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/litige`, {
        method: 'PATCH',
        body: { motif },
        token,
      }),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}
