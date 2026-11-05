import { useSyncExternalStore } from 'react';
import {
  abonnerEntreprise,
  entrepriseCourante,
  type Entreprise,
} from '@delivero/config/entreprise';

/**
 * Company the app is opened for (étape 6 of docs/plan-migration-multi-tenant.md):
 * cached or default value at once, re-renders when GET /api/tenant answers.
 */
export function useEntreprise(): Entreprise {
  return useSyncExternalStore(abonnerEntreprise, entrepriseCourante);
}
