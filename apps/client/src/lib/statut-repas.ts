import type { StatutRepas } from '@/api/types';

export const STATUT_REPAS_LABELS: Record<StatutRepas, string> = {
  en_attente_acceptation: 'En attente',
  confirmee: 'Confirmée',
  refusee: 'Refusée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  recuperee_par_livreur: 'Récupérée',
  en_route: 'En route',
  livree: 'Livrée',
  annulee: 'Annulée',
};

export const TERMINAL_STATUTS_REPAS: StatutRepas[] = ['refusee', 'annulee', 'livree'];

export function isStatutRepasActif(statut: StatutRepas): boolean {
  return !TERMINAL_STATUTS_REPAS.includes(statut);
}
