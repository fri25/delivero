import type { CommandeRepas, StatutRepas } from '@/api/types';

// Sales dashboard maths (F-RES-07), computed from the restaurant's own order
// list. Amounts are the restaurant's dishes only (sousTotal): delivery fees
// and the ChapExpress commission are paid by the client on top. No payout
// figure here — reversement statements (F-RES-08) are still [À ARBITRER].

export type Periode = 'jour' | '7j' | '30j';

export const JOURS_PAR_PERIODE: Record<Periode, number> = { jour: 1, '7j': 7, '30j': 30 };

/** Handed over to the livreur: the kitchen's work is done and sold. */
const STATUTS_SERVIS: StatutRepas[] = ['recuperee_par_livreur', 'en_route', 'livree'];

const FUSEAU = 'Africa/Porto-Novo';
const formatJour = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Calendar day in Benin time, as "YYYY-MM-DD" (sorts as a string). */
export function cleJour(date: number | string | Date): string {
  return formatJour.format(new Date(date));
}

/** The `nb` calendar days ending `decalage` days before today, oldest first. */
export function joursGlissants(nb: number, maintenant: number, decalage = 0): string[] {
  const jours: string[] = [];
  for (let i = nb - 1 + decalage; i >= decalage; i -= 1) {
    jours.push(cleJour(maintenant - i * 86_400_000));
  }
  return jours;
}

export interface PlatVendu {
  nom: string;
  quantite: number;
  montant: number;
}

export interface Bilan {
  servies: number;
  chiffreAffaires: number;
  panierMoyen: number | null;
  refusees: number;
  annulees: number;
  /** Sales per day of the period, oldest first. */
  parJour: { jour: string; montant: number; commandes: number }[];
  topPlats: PlatVendu[];
}

export function bilan(commandes: CommandeRepas[], jours: string[], nbTopPlats = 5): Bilan {
  const dansPeriode = new Set(jours);
  const parJour = new Map(jours.map((jour) => [jour, { jour, montant: 0, commandes: 0 }]));
  const plats = new Map<string, PlatVendu>();
  let servies = 0;
  let chiffreAffaires = 0;
  let refusees = 0;
  let annulees = 0;

  for (const commande of commandes) {
    const jour = cleJour(commande.createdAt);
    if (!dansPeriode.has(jour)) continue;
    if (commande.statut === 'refusee') refusees += 1;
    if (commande.statut === 'annulee') annulees += 1;
    if (!STATUTS_SERVIS.includes(commande.statut)) continue;

    const montant = Number(commande.commande.sousTotal ?? 0);
    servies += 1;
    chiffreAffaires += montant;
    const ligneJour = parJour.get(jour)!;
    ligneJour.montant += montant;
    ligneJour.commandes += 1;

    for (const ligne of commande.lignes) {
      const plat = plats.get(ligne.platId) ?? { nom: ligne.plat.nom, quantite: 0, montant: 0 };
      plat.quantite += ligne.quantite;
      plat.montant += ligne.quantite * Number(ligne.prixUnitaire);
      plats.set(ligne.platId, plat);
    }
  }

  return {
    servies,
    chiffreAffaires,
    panierMoyen: servies > 0 ? Math.round(chiffreAffaires / servies) : null,
    refusees,
    annulees,
    parJour: [...parJour.values()],
    topPlats: [...plats.values()]
      .sort((a, b) => b.quantite - a.quantite || b.montant - a.montant)
      .slice(0, nbTopPlats),
  };
}

/** Relative change in %, or null when there is nothing to compare to. */
export function evolution(actuel: number, precedent: number): number | null {
  if (precedent === 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 100);
}
