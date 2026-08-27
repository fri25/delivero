import type { StatutColis } from '@/api/types';

export const STATUT_COLIS_LABELS: Record<StatutColis, string> = {
  confirmee: 'Confirmée',
  livreur_en_route_enlevement: "En route pour l'enlèvement",
  colis_recupere: 'Récupéré',
  en_route: 'En route',
  livre: 'Livré',
  litige: 'Litige',
  annulee: 'Annulée',
};
