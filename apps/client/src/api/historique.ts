import { EMPLETTES_ACTIF } from '@delivero/config/perimetre-v1';
import { useMesCommandes } from './commandes-repas';
import { useMesCommandesColis } from './commandes-colis';
import { useMesCommandesCoursesExpress } from './commandes-courses-express';
import { useMesCommandesEmplettes } from './commandes-emplettes';
import { isStatutRepasActif, STATUT_REPAS_LABELS } from '../lib/statut-repas';
import { isStatutColisActif, STATUT_COLIS_LABELS } from '../lib/statut-colis';
import {
  isStatutCoursesExpressActif,
  STATUT_COURSES_EXPRESS_LABELS,
} from '../lib/statut-courses-express';
import { isStatutEmplettesActif, STATUT_EMPLETTES_LABELS } from '../lib/statut-emplettes';
import { doitEtrePaye, STATUT_PAIEMENT_LABELS } from '../lib/paiement';
import type { CommandeEmplettes, PaiementResume, TypeService } from './types';

export type { TypeService };

export const TYPE_SERVICE_LABELS: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  courses_express: 'Course express',
  emplettes: 'Emplettes',
};

/** One order of any service, normalized for the unified history (F-CLI-06). */
export interface CommandeResume {
  id: string;
  typeService: TypeService;
  titre: string;
  montantTotal: string | null;
  statutLabel: string;
  actif: boolean;
  createdAt: string;
  lien: string;
}

// Emplettes is hidden in V1: swap the hook for a no-op at module level, so the
// API is never called and the bundler drops the branch (EMPLETTES_ACTIF is a
// literal). Chosen once at load time, so the rules of hooks still hold.
const AUCUNE_COMMANDE_EMPLETTES = { data: [] as CommandeEmplettes[], isPending: false, isError: false };
const useListeEmplettes = EMPLETTES_ACTIF ? useMesCommandesEmplettes : () => AUCUNE_COMMANDE_EMPLETTES;

// An open order whose Mobile Money payment has not gone through has not been
// sent to anyone yet: show that instead of its service status.
function libelleStatut(
  statutLabel: string,
  actif: boolean,
  paiement: PaiementResume | null,
): string {
  return actif && paiement && doitEtrePaye(paiement) ? STATUT_PAIEMENT_LABELS[paiement.statut] : statutLabel;
}

export function useHistoriqueCommandes() {
  const repas = useMesCommandes();
  const colis = useMesCommandesColis();
  const coursesExpress = useMesCommandesCoursesExpress();
  const emplettes = useListeEmplettes();

  const commandes: CommandeResume[] = [
    ...(repas.data ?? []).map((c) => ({
      id: c.id,
      typeService: 'repas' as const,
      titre: c.partenaire.nom,
      montantTotal: c.commande.montantTotal,
      statutLabel: libelleStatut(STATUT_REPAS_LABELS[c.statut] ?? c.statut, isStatutRepasActif(c.statut), c.commande.paiement),
      actif: isStatutRepasActif(c.statut),
      createdAt: c.createdAt,
      lien: `/commandes/${c.id}`,
    })),
    ...(colis.data ?? []).map((c) => ({
      id: c.id,
      typeService: 'colis' as const,
      titre: `Pour ${c.destinataireNom}`,
      montantTotal: c.commande.montantTotal,
      statutLabel: libelleStatut(STATUT_COLIS_LABELS[c.statut] ?? c.statut, isStatutColisActif(c.statut), c.commande.paiement),
      actif: isStatutColisActif(c.statut),
      createdAt: c.createdAt,
      lien: `/colis/commandes/${c.id}`,
    })),
    ...(coursesExpress.data ?? []).map((c) => ({
      id: c.id,
      typeService: 'courses_express' as const,
      titre: c.description,
      montantTotal: c.commande.montantTotal,
      statutLabel: libelleStatut(STATUT_COURSES_EXPRESS_LABELS[c.statut] ?? c.statut, isStatutCoursesExpressActif(c.statut), c.commande.paiement),
      actif: isStatutCoursesExpressActif(c.statut),
      createdAt: c.createdAt,
      lien: `/courses-express/commandes/${c.id}`,
    })),
    ...(emplettes.data ?? []).map((c) => ({
      id: c.id,
      typeService: 'emplettes' as const,
      titre: c.lieuAchat ?? 'Emplettes',
      montantTotal: c.commande.montantTotal,
      statutLabel: libelleStatut(STATUT_EMPLETTES_LABELS[c.statut] ?? c.statut, isStatutEmplettesActif(c.statut), c.commande.paiement),
      actif: isStatutEmplettesActif(c.statut),
      createdAt: c.createdAt,
      lien: `/emplettes/commandes/${c.id}`,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    commandes,
    isPending: repas.isPending || colis.isPending || coursesExpress.isPending || emplettes.isPending,
    // Partial failure: show what loaded and warn, rather than hide everything.
    isError: repas.isError || colis.isError || coursesExpress.isError || emplettes.isError,
  };
}
