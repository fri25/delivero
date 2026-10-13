import type { StatutRepas } from '@/api/types';

/** Repas statuses as seen by the livreur (from the pick-up on). */
export const STATUT_REPAS_LABELS: Partial<Record<StatutRepas, string>> = {
  prete: 'Prête',
  recuperee_par_livreur: 'Récupérée',
  en_route: 'En route',
  livree: 'Livrée',
  annulee: 'Annulée',
};
