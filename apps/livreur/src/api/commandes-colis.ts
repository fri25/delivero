import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeColis } from './types';

// Pas de WebSocket ni de notification push in-app à ce stade (voir
// docs/architecture.md) : on rafraîchit par intervalle en attendant.
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
    mutationFn: (id: string) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/prendre-en-charge`, { method: 'PATCH', token }),
    // Même en cas d'échec (409 : déjà pris par un autre livreur), on
    // rafraîchit la liste pour faire disparaître la carte obsolète.
    onSettled: () => invalidateColis(queryClient),
  });
}

export function useMarquerColisRecupere() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/recupere`, { method: 'PATCH', token }),
    onSuccess: () => invalidateColis(queryClient),
  });
}

export function useMarquerColisEnRoute() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/en-route`, { method: 'PATCH', token }),
    onSuccess: () => invalidateColis(queryClient),
  });
}

interface LivrerColisInput {
  id: string;
  codeOtp?: string;
  nomReceptionnaire?: string;
  montantEncaisse?: number;
}

export function useLivrerColis() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: LivrerColisInput) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/livraison`, { method: 'PATCH', body: dto, token }),
    onSuccess: () => invalidateColis(queryClient),
  });
}

export function useDeclarerLitigeColis() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/litige`, { method: 'PATCH', body: { motif }, token }),
    onSuccess: () => invalidateColis(queryClient),
  });
}
