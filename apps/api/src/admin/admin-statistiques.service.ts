import { Injectable } from '@nestjs/common';
import {
  Prisma,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutPaiement,
  StatutRepas,
  TypeService,
} from '@prisma/client';
import { PAIEMENT_ENGAGE_WHERE } from '../paiements/paiement-engage';
import { PrismaService } from '../prisma/prisma.service';
import {
  bornesPeriode,
  calculerStatistiques,
  type Issue,
  type LigneStatistique,
  type Periode,
} from './statistiques';

const STATISTIQUE_SELECT = {
  typeService: true,
  createdAt: true,
  montantTotal: true,
  sousTotal: true,
  livreur: { select: { id: true, user: { select: { nom: true } } } },
  commandeRepas: {
    select: {
      statut: true,
      updatedAt: true,
      partenaire: { select: { id: true, nom: true } },
    },
  },
  commandeColis: { select: { statut: true, updatedAt: true } },
  commandeEmplettes: { select: { statut: true, updatedAt: true } },
  commandeCoursesExpress: { select: { statut: true, updatedAt: true } },
} satisfies Prisma.CommandeSelect;

type Ligne = Prisma.CommandeGetPayload<{ select: typeof STATISTIQUE_SELECT }>;

const TERMINES: string[] = [
  StatutRepas.livree,
  StatutColis.livre,
  StatutCoursesExpress.terminee,
  StatutEmplettes.livree,
];
const ANNULES: string[] = [StatutRepas.annulee, StatutRepas.refusee];

function issue(statut: string): Issue {
  if (TERMINES.includes(statut)) return 'terminee';
  if (ANNULES.includes(statut)) return 'annulee';
  return 'en_cours';
}

function versLigne(commande: Ligne): LigneStatistique | null {
  const service =
    commande.commandeRepas ??
    commande.commandeColis ??
    commande.commandeEmplettes ??
    commande.commandeCoursesExpress;
  if (!service) return null;
  return {
    typeService: commande.typeService,
    createdAt: commande.createdAt.getTime(),
    majAt: service.updatedAt.getTime(),
    issue: issue(service.statut),
    montantTotal: Number(commande.montantTotal ?? 0),
    sousTotal:
      commande.typeService === TypeService.repas
        ? Number(commande.sousTotal ?? 0)
        : null,
    restaurant: commande.commandeRepas?.partenaire ?? null,
    livreur: commande.livreur
      ? { id: commande.livreur.id, nom: commande.livreur.user.nom }
      : null,
  };
}

// F-ADM-14. Orders whose Mobile Money payment never went through are left
// out, like everywhere else in the back-office. Computed in memory over the
// period and the one before: fine for one town's volume; move to SQL
// aggregates if the history grows large.
@Injectable()
export class AdminStatistiquesService {
  constructor(private readonly prisma: PrismaService) {}

  async calculer(periode: Periode, maintenant = Date.now()) {
    const bornes = bornesPeriode(periode, maintenant);
    const [commandes, remboursements] = await Promise.all([
      this.prisma.commande.findMany({
        where: {
          createdAt: { gte: new Date(bornes.debutPrecedent) },
          OR: [
            { paiement: { is: null } },
            { paiement: { is: PAIEMENT_ENGAGE_WHERE } },
          ],
        },
        select: STATISTIQUE_SELECT,
      }),
      this.prisma.paiement.aggregate({
        where: { statut: StatutPaiement.a_rembourser },
        _count: true,
        _sum: { montant: true },
      }),
    ]);
    const lignes = commandes
      .map(versLigne)
      .filter((ligne): ligne is LigneStatistique => ligne !== null);
    return {
      periode,
      ...calculerStatistiques(lignes, bornes),
      aRembourser: {
        nombre: remboursements._count,
        montant: Number(remboursements._sum.montant ?? 0),
      },
    };
  }
}
