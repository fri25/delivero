import type { StatutEmplettes } from '@/api/types';

export const STATUT_EMPLETTES_LABELS: Record<StatutEmplettes, string> = {
  confirmee: 'Confirmée',
  achats_en_cours: 'Achats en cours',
  validation_depassement: 'Dépassement de budget — votre accord requis',
  achats_termines: 'Achats terminés',
  en_route: 'En route',
  livree: 'Livrée',
  litige: 'Litige en cours',
  annulee: 'Annulée',
};

export const TERMINAL_STATUTS_EMPLETTES: StatutEmplettes[] = ['livree', 'annulee', 'litige'];

export function isStatutEmplettesActif(statut: StatutEmplettes): boolean {
  return !TERMINAL_STATUTS_EMPLETTES.includes(statut);
}
