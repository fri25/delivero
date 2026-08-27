import type { StatutCoursesExpress } from '@/api/types';

export const STATUT_COURSES_EXPRESS_LABELS: Record<StatutCoursesExpress, string> = {
  confirmee: 'Confirmée',
  en_cours: 'En cours',
  etape_realisee: 'Étape réalisée',
  terminee: 'Terminée',
  litige: 'Litige',
  annulee: 'Annulée',
};
