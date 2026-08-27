import type { StatutCoursesExpress } from '@/api/types';

export const STATUT_COURSES_EXPRESS_LABELS: Record<StatutCoursesExpress, string> = {
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  etape_realisee: 'Étape réalisée',
  terminee: 'Terminée',
  litige: 'Litige en cours',
  annulee: 'Annulée',
};

export const TERMINAL_STATUTS_COURSES_EXPRESS: StatutCoursesExpress[] = [
  'terminee',
  'annulee',
  'litige',
];

export function isStatutCoursesExpressActif(statut: StatutCoursesExpress): boolean {
  return !TERMINAL_STATUTS_COURSES_EXPRESS.includes(statut);
}
