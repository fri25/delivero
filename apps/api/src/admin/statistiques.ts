import { TypeService } from '@prisma/client';

// F-ADM-14 — dashboard figures, computed from one row per order of the
// period. Pure: no database, unit-tested in statistiques.spec.ts.

// Benin has a fixed UTC+1 offset (no daylight saving): a day runs from
// 23:00 UTC the day before to 23:00 UTC.
const DECALAGE_BENIN_MS = 60 * 60 * 1000;
const JOUR_MS = 24 * 60 * 60 * 1000;

export type Periode = 'jour' | '7j' | '30j';
export const JOURS_PAR_PERIODE: Record<Periode, number> = {
  jour: 1,
  '7j': 7,
  '30j': 30,
};

/** Start (UTC instant) of the Benin day containing `instant`. */
export function debutJourBenin(instant: number): number {
  return (
    Math.floor((instant + DECALAGE_BENIN_MS) / JOUR_MS) * JOUR_MS -
    DECALAGE_BENIN_MS
  );
}

/** "YYYY-MM-DD" of the Benin day containing `instant`. */
export function cleJourBenin(instant: number): string {
  return new Date(instant + DECALAGE_BENIN_MS).toISOString().slice(0, 10);
}

/** [start, end) of the period ending today, and of the one before it. */
export function bornesPeriode(periode: Periode, maintenant: number) {
  const nbJours = JOURS_PAR_PERIODE[periode];
  const fin = debutJourBenin(maintenant) + JOUR_MS;
  const debut = fin - nbJours * JOUR_MS;
  return { debut, fin, debutPrecedent: debut - nbJours * JOUR_MS, nbJours };
}

export type Issue = 'terminee' | 'annulee' | 'en_cours';

export interface LigneStatistique {
  typeService: TypeService;
  createdAt: number;
  /** Last change of the service status: delivery time once terminated. */
  majAt: number;
  issue: Issue;
  montantTotal: number;
  /** Repas only: the dishes, paid in full to the restaurant. */
  sousTotal: number | null;
  restaurant: { id: string; nom: string } | null;
  livreur: { id: string; nom: string } | null;
}

export interface Bilan {
  demandes: number;
  terminees: number;
  annulees: number;
  enCours: number;
  /** Paid by clients for terminated orders, all services. */
  montantTermine: number;
  panierMoyen: number | null;
  /** Cancelled or refused, over all orders of the period (%). */
  tauxAnnulation: number | null;
  /** Average order-to-delivery time (min), from the last status change. */
  delaiMoyenMinutes: number | null;
}

function bilan(lignes: LigneStatistique[]): Bilan {
  const terminees = lignes.filter((ligne) => ligne.issue === 'terminee');
  const annulees = lignes.filter((ligne) => ligne.issue === 'annulee').length;
  const montantTermine = terminees.reduce(
    (total, ligne) => total + ligne.montantTotal,
    0,
  );
  const delais = terminees.map(
    (ligne) => (ligne.majAt - ligne.createdAt) / 60_000,
  );
  return {
    demandes: lignes.length,
    terminees: terminees.length,
    annulees,
    enCours: lignes.length - terminees.length - annulees,
    montantTermine,
    panierMoyen:
      terminees.length > 0
        ? Math.round(montantTermine / terminees.length)
        : null,
    tauxAnnulation:
      lignes.length > 0 ? Math.round((annulees / lignes.length) * 100) : null,
    delaiMoyenMinutes:
      delais.length > 0
        ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length)
        : null,
  };
}

export interface Classement {
  id: string;
  nom: string;
  terminees: number;
  montant: number;
}

function classer(
  lignes: LigneStatistique[],
  cle: (ligne: LigneStatistique) => { id: string; nom: string } | null,
  montant: (ligne: LigneStatistique) => number,
  nombre = 5,
): Classement[] {
  const parId = new Map<string, Classement>();
  for (const ligne of lignes) {
    const entite = cle(ligne);
    if (!entite || ligne.issue !== 'terminee') continue;
    const courant = parId.get(entite.id) ?? {
      ...entite,
      terminees: 0,
      montant: 0,
    };
    courant.terminees += 1;
    courant.montant += montant(ligne);
    parId.set(entite.id, courant);
  }
  return [...parId.values()]
    .sort((a, b) => b.terminees - a.terminees || b.montant - a.montant)
    .slice(0, nombre);
}

const SERVICES: TypeService[] = [
  TypeService.repas,
  TypeService.colis,
  TypeService.courses_express,
  TypeService.emplettes,
];

export function calculerStatistiques(
  lignes: LigneStatistique[],
  bornes: ReturnType<typeof bornesPeriode>,
) {
  const periode = lignes.filter(
    (ligne) => ligne.createdAt >= bornes.debut && ligne.createdAt < bornes.fin,
  );
  const precedente = lignes.filter(
    (ligne) =>
      ligne.createdAt >= bornes.debutPrecedent &&
      ligne.createdAt < bornes.debut,
  );

  const parJour = new Map<string, { jour: string; demandes: number }>();
  for (let i = 0; i < bornes.nbJours; i += 1) {
    const jour = cleJourBenin(bornes.debut + i * JOUR_MS);
    parJour.set(jour, { jour, demandes: 0 });
  }
  for (const ligne of periode) {
    const jour = parJour.get(cleJourBenin(ligne.createdAt));
    if (jour) jour.demandes += 1;
  }

  return {
    actuel: bilan(periode),
    precedent: bilan(precedente),
    parService: SERVICES.map((typeService) => ({
      typeService,
      ...bilan(periode.filter((ligne) => ligne.typeService === typeService)),
    })).filter((service) => service.demandes > 0),
    parJour: [...parJour.values()],
    restaurants: classer(
      periode,
      (ligne) => ligne.restaurant,
      (ligne) => ligne.sousTotal ?? 0,
    ),
    livreurs: classer(
      periode,
      (ligne) => ligne.livreur,
      (ligne) => ligne.montantTotal,
    ),
  };
}
