import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import { TERMINAL_STATUTS_EMPLETTES } from '../lib/statut-emplettes';
import type { CommandeEmplettes, ModeFinancementEmplettes, PreferenceRemplacement } from './types';

interface CreateArticleInput {
  libelle: string;
  preferenceRemplacement?: PreferenceRemplacement;
}

interface CreateCommandeEmplettesInput {
  zoneId: string;
  adresseId: string;
  lieuAchat?: string;
  budgetMax: number;
  modeFinancement: ModeFinancementEmplettes;
  articles: CreateArticleInput[];
}

interface EstimationEmplettes {
  zoneId: string;
  budgetMax: number;
  fraisLivraison: number;
  fraisServiceEstime: number;
  totalEstime: number;
}

export function useEstimationEmplettes(zoneId: string | undefined, budgetMax: number | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['estimation-emplettes', zoneId, budgetMax],
    queryFn: () =>
      apiFetch<EstimationEmplettes>(
        `/commandes/emplettes/estimation?zoneId=${encodeURIComponent(zoneId!)}&budgetMax=${budgetMax}`,
        { token },
      ),
    enabled: Boolean(zoneId && budgetMax && budgetMax > 0 && token),
  });
}

export function useCreateCommandeEmplettes() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommandeEmplettesInput) =>
      apiFetch<CommandeEmplettes>('/commandes/emplettes', {
        method: 'POST',
        body: { ...dto, mode: 'liste_libre' },
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-commandes-emplettes'] }),
  });
}

export function useCommandeEmplettes(id: string | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['commande-emplettes', id],
    queryFn: () => apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}`, { token }),
    enabled: Boolean(id && token),
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && TERMINAL_STATUTS_EMPLETTES.includes(statut) ? false : 5000;
    },
  });
}

export function useMesCommandesEmplettes() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-commandes-emplettes'],
    queryFn: () => apiFetch<CommandeEmplettes[]>('/commandes/emplettes/mes-commandes', { token }),
    enabled: Boolean(token),
  });
}

export function useAnnulerCommandeEmplettes() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/annuler`, { method: 'PATCH', token }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mes-commandes-emplettes'] });
      queryClient.setQueryData(['commande-emplettes', data.id], data);
    },
  });
}

export function useValiderDepassement() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accepter }: { id: string; accepter: boolean }) =>
      apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/valider-depassement`, {
        method: 'PATCH',
        body: { accepter },
        token,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mes-commandes-emplettes'] });
      queryClient.setQueryData(['commande-emplettes', data.id], data);
    },
  });
}
