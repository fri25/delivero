import type { StatutColis, StatutCoursesExpress, StatutEmplettes, StatutRepas } from '@/api/types';
import { STATUT_COLIS_LABELS } from '@/lib/statut-colis';
import { STATUT_COURSES_EXPRESS_LABELS } from '@/lib/statut-courses-express';
import { STATUT_EMPLETTES_LABELS } from '@/lib/statut-emplettes';
import { STATUT_REPAS_LABELS } from '@/lib/statut-repas';

/** The four services, as the livreur sees them in the unified lists. */
export type ServiceLivreur = 'repas' | 'colis' | 'courses_express' | 'emplettes';

export const SERVICE_LABELS: Record<ServiceLivreur, string> = {
  repas: 'Repas',
  colis: 'Colis',
  courses_express: 'Course en ville',
  emplettes: 'Emplettes',
};

// Closed for the livreur: nothing left to do, shown in Historique.
const TERMINES: {
  repas: StatutRepas[];
  colis: StatutColis[];
  courses_express: StatutCoursesExpress[];
  emplettes: StatutEmplettes[];
} = {
  repas: ['livree', 'annulee', 'refusee'],
  colis: ['livre', 'litige', 'annulee'],
  courses_express: ['terminee', 'litige', 'annulee'],
  emplettes: ['livree', 'litige', 'annulee'],
};

export function estTerminee(service: ServiceLivreur, statut: string): boolean {
  return (TERMINES[service] as string[]).includes(statut);
}

/** Completed normally (vs cancelled / dispute), for the history badge. */
export function estReussie(statut: string): boolean {
  return statut === 'livree' || statut === 'livre' || statut === 'terminee';
}

/** "à l'instant", "il y a 12 min", "il y a 3 h", then the date. */
export function anciennete(date: string, maintenant: number = Date.now()): string {
  const minutes = Math.floor((maintenant - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Porto-Novo' }).format(
    new Date(date),
  );
}

const LIBELLES: Record<ServiceLivreur, Record<string, string>> = {
  repas: STATUT_REPAS_LABELS as Record<string, string>,
  colis: STATUT_COLIS_LABELS,
  courses_express: STATUT_COURSES_EXPRESS_LABELS,
  emplettes: STATUT_EMPLETTES_LABELS,
};

export function libelleStatut(service: ServiceLivreur, statut: string): string {
  return LIBELLES[service][statut] ?? statut;
}

// First status of each service, before any livreur action. One of my tasks
// still at that status was assigned by the dispatcher (F-ADM-02/03).
const STATUT_INITIAL: Record<ServiceLivreur, string> = {
  repas: 'prete',
  colis: 'confirmee',
  courses_express: 'confirmee',
  emplettes: 'confirmee',
};

export function estAttribueeNonDemarree(service: ServiceLivreur, statut: string): boolean {
  return statut === STATUT_INITIAL[service];
}
