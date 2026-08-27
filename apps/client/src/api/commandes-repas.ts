import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import { TERMINAL_STATUTS_REPAS } from '../lib/statut-repas';
import type { CommandeRepas, ModePaiement } from './types';

interface CreateCommandeRepasInput {
  partenaireId: string;
  adresseId: string;
  modePaiement: ModePaiement;
  lignes: { platId: string; quantite: number; instructions?: string }[];
}

export function useCreateCommandeRepas() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommandeRepasInput) =>
      apiFetch<CommandeRepas>('/commandes/repas', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-commandes'] }),
  });
}

export function useCommandeRepas(id: string | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['commande-repas', id],
    queryFn: () => apiFetch<CommandeRepas>(`/commandes/repas/${id}`, { token }),
    enabled: Boolean(id && token),
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && TERMINAL_STATUTS_REPAS.includes(statut) ? false : 5000;
    },
  });
}

export function useMesCommandes() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-commandes'],
    queryFn: () => apiFetch<CommandeRepas[]>('/commandes/repas/mes-commandes', { token }),
    enabled: Boolean(token),
  });
}

export function useAnnulerCommande() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeRepas>(`/commandes/repas/${id}/annuler`, { method: 'PATCH', token }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
      queryClient.setQueryData(['commande-repas', data.id], data);
    },
  });
}
