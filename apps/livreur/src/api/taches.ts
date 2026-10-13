import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { useCoursesDisponibles, useMesCourses } from './commandes';
import { useColisDisponibles, useMesColis } from './commandes-colis';
import { useCoursesExpressDisponibles, useMesCoursesExpress } from './commandes-courses-express';
import { useEmplettesDisponibles, useMesEmplettes } from './commandes-emplettes';
import type { CommandeColis, CommandeCoursesExpress, CommandeEmplettes, CommandeRepas } from './types';
import type { ActionEnFile } from '@/lib/rejeu';
import { useFileActionsStore } from '@/stores/file-actions-store';

/** One order of any service, for the unified "À prendre / En cours" lists. */
export type Tache =
  | { service: 'repas'; id: string; createdAt: string; statut: string; commande: CommandeRepas }
  | { service: 'colis'; id: string; createdAt: string; statut: string; commande: CommandeColis }
  | { service: 'courses_express'; id: string; createdAt: string; statut: string; commande: CommandeCoursesExpress }
  | { service: 'emplettes'; id: string; createdAt: string; statut: string; commande: CommandeEmplettes };

// Emplettes is hidden in V1: swap its hooks for no-ops at module level, so
// its API is never polled (EMPLETTES_ACTIF is a literal; the choice is made
// once at load time, so the rules of hooks still hold).
const AUCUNE = { data: [] as CommandeEmplettes[], isPending: false, isError: false };
const useEmplettesDispo = EMPLETTES_ACTIF ? useEmplettesDisponibles : () => AUCUNE;
const useEmplettesMiennes = EMPLETTES_ACTIF ? useMesEmplettes : () => AUCUNE;

function assembler(
  repas: CommandeRepas[] | undefined,
  colis: CommandeColis[] | undefined,
  express: CommandeCoursesExpress[] | undefined,
  emplettes: CommandeEmplettes[] | undefined,
): Tache[] {
  return [
    ...(repas ?? []).map((c) => ({ service: 'repas' as const, id: c.id, createdAt: c.createdAt, statut: c.statut, commande: c })),
    ...(colis ?? []).map((c) => ({ service: 'colis' as const, id: c.id, createdAt: c.createdAt, statut: c.statut, commande: c })),
    ...(express ?? []).map((c) => ({ service: 'courses_express' as const, id: c.id, createdAt: c.createdAt, statut: c.statut, commande: c })),
    ...(emplettes ?? []).map((c) => ({ service: 'emplettes' as const, id: c.id, createdAt: c.createdAt, statut: c.statut, commande: c })),
  ];
}

/** Orders waiting for a livreur, every service. */
export function useTachesDisponibles() {
  const repas = useCoursesDisponibles();
  const colis = useColisDisponibles();
  const express = useCoursesExpressDisponibles();
  const emplettes = useEmplettesDispo();
  return {
    taches: assembler(repas.data, colis.data, express.data, emplettes.data),
    isPending: repas.isPending || colis.isPending || express.isPending || emplettes.isPending,
    isError: repas.isError || colis.isError || express.isError || emplettes.isError,
  };
}

/**
 * Actions still queued offline, applied over the server data: a poll that
 * lands before the replay must not move a card back a step (the livreur
 * would tap again).
 */
function avecActionsEnAttente(taches: Tache[], actions: ActionEnFile[]): Tache[] {
  return taches.map((tache) => {
    let resultat = tache;
    for (const action of actions) {
      if (action.erreur || action.service !== tache.service || action.commandeId !== tache.id) continue;
      const { statut, etapeId } = action.attendu;
      if (statut) resultat = { ...resultat, statut, commande: { ...resultat.commande, statut } } as Tache;
      if (etapeId && resultat.service === 'courses_express') {
        resultat = {
          ...resultat,
          commande: {
            ...resultat.commande,
            etapes: resultat.commande.etapes.map((etape) => (etape.id === etapeId ? { ...etape, realisee: true } : etape)),
          },
        };
      }
    }
    return resultat;
  });
}

/** This livreur's orders, every service, any status (queued actions applied). */
export function useMesTaches() {
  const repas = useMesCourses();
  const colis = useMesColis();
  const express = useMesCoursesExpress();
  const emplettes = useEmplettesMiennes();
  const actions = useFileActionsStore((state) => state.actions);
  return {
    taches: avecActionsEnAttente(assembler(repas.data, colis.data, express.data, emplettes.data), actions),
    isPending: repas.isPending || colis.isPending || express.isPending || emplettes.isPending,
    isError: repas.isError || colis.isError || express.isError || emplettes.isError,
  };
}
