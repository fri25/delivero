import type { StatutColis } from '@/api/types';

export const STATUT_COLIS_LABELS: Record<StatutColis, string> = {
  confirmee: 'Confirmée',
  livreur_en_route_enlevement: "Livreur en route pour l'enlèvement",
  colis_recupere: 'Colis récupéré',
  en_route: 'En route vers le destinataire',
  livre: 'Livré',
  litige: 'Litige en cours',
  annulee: 'Annulée',
};

export const TERMINAL_STATUTS_COLIS: StatutColis[] = ['livre', 'annulee', 'litige'];

export function isStatutColisActif(statut: StatutColis): boolean {
  return !TERMINAL_STATUTS_COLIS.includes(statut);
}
