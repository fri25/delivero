import type { StatutEmplettes } from '@/api/types';

export const STATUT_EMPLETTES_LABELS: Record<StatutEmplettes, string> = {
  confirmee: 'Confirmée',
  achats_en_cours: 'Achats en cours',
  validation_depassement: "En attente d'accord client",
  achats_termines: 'Achats terminés',
  en_route: 'En route',
  livree: 'Livrée',
  litige: 'Litige',
  annulee: 'Annulée',
};
