import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ModeFinancementEmplettes,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutRepas,
  TypeMouvementPortefeuille,
  TypeService,
} from '@prisma/client';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { PrismaService } from '../prisma/prisma.service';

// F-LIV-11 : "courses par service, montants" seulement — pas de "gains".
// Q-08 (decisions-ouvertes.md) laisse entièrement ouvert le modèle de
// rémunération du livreur par course et cite explicitement ce récapitulatif
// comme bloqué par cette question ; on ne calcule donc aucun montant dû au
// livreur ici, uniquement ce qui est déjà tracé (encaissements, avances).
const STATUT_LIVRE: Record<TypeService, string> = {
  repas: StatutRepas.livree,
  colis: StatutColis.livre,
  emplettes: StatutEmplettes.livree,
  courses_express: StatutCoursesExpress.terminee,
};

@Injectable()
export class LivreursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
  ) {}

  async getOwn(userId: string) {
    const livreur = await this.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur) {
      throw new NotFoundException('Aucun profil livreur associé à ce compte.');
    }
    return livreur;
  }

  async getPortefeuille(userId: string) {
    const livreur = await this.getOwn(userId);
    return this.portefeuille.getResume(
      livreur.id,
      livreur.plafondAvance,
      livreur.plafondCaisse,
    );
  }

  async toggleDisponibilite(userId: string, disponible: boolean) {
    const livreur = await this.getOwn(userId);
    return this.prisma.livreur.update({
      where: { id: livreur.id },
      data: { disponible },
    });
  }

  async cloturerCaisse(userId: string, montantDeclare: number) {
    const livreur = await this.getOwn(userId);
    return this.portefeuille.cloturerCaisse(livreur.id, montantDeclare);
  }

  async getClotures(userId: string) {
    const livreur = await this.getOwn(userId);
    return this.prisma.clotureCaisse.findMany({
      where: { livreurId: livreur.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getRecapJournalier(userId: string) {
    const livreur = await this.getOwn(userId);
    const debutJournee = new Date();
    debutJournee.setUTCHours(0, 0, 0, 0);

    const [commandes, encaissements, avancesEmplettes] = await Promise.all([
      this.prisma.commande.findMany({
        where: { livreurId: livreur.id, updatedAt: { gte: debutJournee } },
        select: {
          typeService: true,
          commandeRepas: { select: { statut: true } },
          commandeColis: { select: { statut: true } },
          commandeEmplettes: { select: { statut: true } },
          commandeCoursesExpress: { select: { statut: true } },
        },
      }),
      this.prisma.mouvementPortefeuille.aggregate({
        where: {
          livreurId: livreur.id,
          type: TypeMouvementPortefeuille.encaissement,
          createdAt: { gte: debutJournee },
        },
        _sum: { montant: true },
      }),
      this.prisma.commandeEmplettes.findMany({
        where: {
          modeFinancement: ModeFinancementEmplettes.avance_livreur,
          statut: StatutEmplettes.livree,
          commande: { livreurId: livreur.id, updatedAt: { gte: debutJournee } },
        },
        select: { montantReel: true, budgetMax: true },
      }),
    ]);

    const parService: Record<TypeService, number> = {
      repas: 0,
      colis: 0,
      emplettes: 0,
      courses_express: 0,
    };
    for (const commande of commandes) {
      const statut =
        commande.commandeRepas?.statut ??
        commande.commandeColis?.statut ??
        commande.commandeEmplettes?.statut ??
        commande.commandeCoursesExpress?.statut;
      if (statut === STATUT_LIVRE[commande.typeService]) {
        parService[commande.typeService] += 1;
      }
    }

    const avanceAujourdhui = avancesEmplettes.reduce(
      (total, c) => total + Number(c.montantReel ?? c.budgetMax),
      0,
    );

    return {
      parService,
      encaisseAujourdhui: Number(encaissements._sum.montant ?? 0),
      avanceAujourdhui,
    };
  }
}
