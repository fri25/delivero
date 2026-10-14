import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type {
  ModeEmplettes,
  ModeFinancementEmplettes,
  ModePaiement,
  PreferenceRemplacement,
  TailleColis,
} from './types';

interface SaisieManuelleRepasInput {
  clientNom: string;
  clientTelephone: string;
  pointDeRepere: string;
  /** Priced neighbourhood (Q-28). */
  quartierId: string;
  quartier?: string;
  partenaireId: string;
  modePaiement: ModePaiement;
  lignes: { platId: string; quantite: number; instructions?: string }[];
}

interface SaisieManuelleColisInput {
  clientNom: string;
  clientTelephone: string;
  pointDeRepereEnlevement: string;
  zoneId: string;
  taille: TailleColis;
  destinataireNom: string;
  destinataireTelephone: string;
  quartierLivraisonId: string;
  quartierLivraison?: string;
  adresseLivraison?: string;
  pointDeRepereLivraison: string;
  valeurDeclaree?: number;
  fragile?: boolean;
  montantContreRemboursement?: number;
  modePaiement: ModePaiement;
  conditionsAcceptees: boolean;
}

interface SaisieManuelleEmplettesInput {
  clientNom: string;
  clientTelephone: string;
  pointDeRepere: string;
  mode: ModeEmplettes;
  zoneId: string;
  lieuAchat?: string;
  budgetMax: number;
  modeFinancement: ModeFinancementEmplettes;
  articles: { libelle: string; preferenceRemplacement?: PreferenceRemplacement }[];
}

interface SaisieManuelleCoursesExpressInput {
  clientNom: string;
  clientTelephone: string;
  description: string;
  zoneId: string;
  modePaiement: ModePaiement;
  etapes: { description: string; pointDeRepere: string; adresse?: string; quartierId: string; quartier?: string }[];
}

// Une commande créée, quel que soit le service : invalide la vue d'ensemble
// (F-ADM-01) pour qu'elle apparaisse immédiatement dans la liste à dispatcher.
function useSaisieManuelle<TInput>(path: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: TInput) =>
      apiFetch(`/admin/saisie-manuelle/${path}`, { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-commandes'] }),
  });
}

export const useSaisieManuelleRepas = () => useSaisieManuelle<SaisieManuelleRepasInput>('repas');
export const useSaisieManuelleColis = () => useSaisieManuelle<SaisieManuelleColisInput>('colis');
export const useSaisieManuelleEmplettes = () =>
  useSaisieManuelle<SaisieManuelleEmplettesInput>('emplettes');
export const useSaisieManuelleCoursesExpress = () =>
  useSaisieManuelle<SaisieManuelleCoursesExpressInput>('courses-express');

/**
 * The client sent Mobile Money to the ChapExpress number: the dispatcher
 * confirms receipt with the operator's reference and the order goes out
 * (decision of 13/10). Unpaid, it is cancelled after 30 minutes.
 */
export function usePaiementRecu() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reference }: { id: string; reference: string }) =>
      apiFetch(`/admin/saisie-manuelle/commandes/${id}/paiement-recu`, {
        method: 'PATCH',
        body: { reference },
        token,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-commandes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-remboursements'] });
    },
  });
}
