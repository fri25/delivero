import type { PaiementResume, StatutPaiement } from '@/api/types';

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  en_attente: 'En attente de paiement',
  reussi: 'Payé',
  echoue: 'Paiement échoué',
  a_percevoir_livraison: 'À payer à la livraison',
  a_rembourser: 'Remboursement en cours',
  rembourse: 'Remboursé',
};

/**
 * Mobile Money is paid at order time: until FedaPay confirms, the order is
 * not sent to the restaurant or to livreurs, and the client must (re)pay.
 */
export function doitEtrePaye(paiement: PaiementResume | null | undefined): boolean {
  return (
    paiement?.mode === 'mobile_money' &&
    (paiement.statut === 'en_attente' || paiement.statut === 'echoue')
  );
}
