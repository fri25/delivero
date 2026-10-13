import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { exigerReseau, useExecuterAction } from './hors-ligne';
import { useAuthStore } from '../stores/auth-store';
import type { CommandeEmplettes, StatutArticleEmplette } from './types';

// Polling safety net: real-time alerts (api/alertes.ts) refresh the lists
// at once, this catches up after a dropped socket on unstable 3G.
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
    // Online only (decision of 13/10): the list may be stale offline.
    mutationFn: (id: string) =>
      exigerReseau('Pas de réseau : il faut être connecté pour prendre une course (un autre livreur l’a peut-être déjà prise).', () =>
        apiFetch<CommandeEmplettes>(`/commandes/emplettes/${id}/prendre-en-charge`, {
          method: 'PATCH',
          token,
        }),
      ),
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
    // Online only for now: an over-budget price needs the client's answer
    // (RG-05), which cannot wait for a later sync. Emplettes is off in V1.
    mutationFn: ({ commandeId, articleId, ...dto }: PointerArticleInput) =>
      exigerReseau('Pas de réseau : le pointage d’un article doit être envoyé tout de suite.', () =>
        apiFetch<CommandeEmplettes>(
          `/commandes/emplettes/${commandeId}/articles/${articleId}/pointer`,
          { method: 'PATCH', body: dto, token },
        ),
      ),
    onSuccess: () => invalidateEmplettes(queryClient),
  });
}

// Status updates go through the offline queue (docs/pwa-offline.md).
export function useTerminerAchats() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ id, recapitulatifAchats }: { id: string; recapitulatifAchats: string }) =>
      executer({
        libelle: 'Achats terminés',
        service: 'emplettes',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/emplettes/${id}/achats-termines`,
        corps: { recapitulatifAchats },
        attendu: { statut: 'achats_termines' },
      }),
  });
}

export function useMarquerEmplettesEnRoute() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (id: string) =>
      executer({
        libelle: 'Emplettes en route',
        service: 'emplettes',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/emplettes/${id}/en-route`,
        attendu: { statut: 'en_route' },
      }),
  });
}

export function useMarquerEmplettesLivree() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: (id: string) =>
      executer({
        libelle: 'Emplettes livrées',
        service: 'emplettes',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/emplettes/${id}/livree`,
        attendu: { statut: 'livree' },
      }),
  });
}

export function useDeclarerLitigeEmplettes() {
  const executer = useExecuterAction();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      executer({
        libelle: 'Problème signalé',
        service: 'emplettes',
        commandeId: id,
        methode: 'PATCH',
        chemin: `/commandes/emplettes/${id}/litige`,
        corps: { motif },
        attendu: { statut: 'litige' },
      }),
  });
}
