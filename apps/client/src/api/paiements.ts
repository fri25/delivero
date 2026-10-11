import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import { COMMANDE_QUERY_KEYS } from '../lib/realtime';
import { doitEtrePaye } from '../lib/paiement';
import type { PaiementResume, StatutPaiement, TypeService } from './types';

export interface EtatPaiement {
  commandeId: string;
  typeService: TypeService;
  commandeServiceId: string;
  statut: StatutPaiement;
}

/** Path of the service-specific detail page for an order. */
export function lienCommande(typeService: TypeService, commandeServiceId: string): string {
  switch (typeService) {
    case 'repas':
      return `/commandes/${commandeServiceId}`;
    case 'colis':
      return `/colis/commandes/${commandeServiceId}`;
    case 'courses_express':
      return `/courses-express/commandes/${commandeServiceId}`;
    case 'emplettes':
      return `/emplettes/commandes/${commandeServiceId}`;
  }
}

/**
 * Opens the FedaPay hosted payment page. `commandeId` is the generic order id
 * (`commande.commande.id`), not the service-specific one. Leaves the app on
 * success: FedaPay sends the client back to /paiement/retour/:commandeId.
 */
export function useInitierPaiement() {
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: (commandeId: string) =>
      apiFetch<EtatPaiement & { url: string | null }>(`/paiements/commandes/${commandeId}/initier`, {
        method: 'POST',
        token,
      }),
    onSuccess: (etat) => {
      if (etat.url) {
        window.location.assign(etat.url);
      }
    },
  });
}

export function useSynchroniserPaiement() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commandeId: string) =>
      apiFetch<EtatPaiement>(`/paiements/commandes/${commandeId}/synchroniser`, {
        method: 'POST',
        token,
      }),
    onSuccess: (etat) => {
      const keys = COMMANDE_QUERY_KEYS[etat.typeService];
      queryClient.invalidateQueries({ queryKey: [keys.detail, etat.commandeServiceId] });
      queryClient.invalidateQueries({ queryKey: [keys.liste] });
    },
  });
}

/**
 * Right after an order is created: Mobile Money is paid at order time, so
 * chain straight to the FedaPay page. If it cannot open, land on the order
 * page, which offers to retry the payment.
 */
export function useApresCreationCommande() {
  const navigate = useNavigate();
  const initier = useInitierPaiement();

  const continuer = (
    commande: { commande: { id: string; paiement: PaiementResume | null } },
    lienDetail: string,
    messageSucces: string,
  ) => {
    if (!doitEtrePaye(commande.commande.paiement)) {
      toast.success(messageSucces);
      navigate(lienDetail);
      return;
    }
    initier.mutate(commande.commande.id, {
      onSuccess: (etat) => {
        if (!etat.url) navigate(lienDetail);
      },
      onError: (error) => {
        toast.error(`Commande enregistrée, mais le paiement n’a pas pu s’ouvrir : ${error.message}`);
        navigate(lienDetail);
      },
    });
  };

  return { continuer, isPending: initier.isPending };
}
