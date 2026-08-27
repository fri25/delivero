import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import { TERMINAL_STATUTS_COLIS } from '../lib/statut-colis';
import type { CommandeColis, ModePaiement, SuiviColisPublic, TailleColis } from './types';

interface CreateCommandeColisInput {
  adresseEnlevementId: string;
  zoneId: string;
  taille: TailleColis;
  destinataireNom: string;
  destinataireTelephone: string;
  adresseLivraison: string;
  pointDeRepereLivraison: string;
  valeurDeclaree?: number;
  fragile?: boolean;
  montantContreRemboursement?: number;
  modePaiement: ModePaiement;
  programmationAt?: string;
  conditionsAcceptees: boolean;
}

interface EstimationColis {
  zoneId: string;
  taille: TailleColis;
  tarif: number;
}

export function useEstimationColis(zoneId: string | undefined, taille: TailleColis | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['estimation-colis', zoneId, taille],
    queryFn: () =>
      apiFetch<EstimationColis>(
        `/commandes/colis/estimation?zoneId=${encodeURIComponent(zoneId!)}&taille=${taille}`,
        { token },
      ),
    enabled: Boolean(zoneId && taille && token),
  });
}

export function useCreateCommandeColis() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCommandeColisInput) =>
      apiFetch<CommandeColis>('/commandes/colis', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-commandes-colis'] }),
  });
}

export function useCommandeColis(id: string | undefined) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['commande-colis', id],
    queryFn: () => apiFetch<CommandeColis>(`/commandes/colis/${id}`, { token }),
    enabled: Boolean(id && token),
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && TERMINAL_STATUTS_COLIS.includes(statut) ? false : 5000;
    },
  });
}

export function useMesCommandesColis() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-commandes-colis'],
    queryFn: () => apiFetch<CommandeColis[]>('/commandes/colis/mes-commandes', { token }),
    enabled: Boolean(token),
  });
}

export function useAnnulerCommandeColis() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommandeColis>(`/commandes/colis/${id}/annuler`, { method: 'PATCH', token }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mes-commandes-colis'] });
      queryClient.setQueryData(['commande-colis', data.id], data);
    },
  });
}

// Suivi public : aucun token, l'endpoint n'exige pas d'authentification
// (voir docs/api-colis.md).
export function useSuiviColisPublic(id: string | undefined) {
  return useQuery({
    queryKey: ['suivi-colis', id],
    queryFn: () => apiFetch<SuiviColisPublic>(`/commandes/colis/suivi/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      return statut && TERMINAL_STATUTS_COLIS.includes(statut) ? false : 8000;
    },
  });
}
