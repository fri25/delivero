import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ModeFinancementEmplettes,
  Prisma,
  StatutEmplettes,
  TypeMouvementPortefeuille,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// V09 / RG-02 / RG-14 : jusqu'ici plafondAvance et plafondCaisse existaient en
// base mais n'étaient jamais lus. Ce service leur donne un effet réel au
// moment de l'attribution d'une course, sans construire le back-office caisse
// (F-ADM-12/13, hors périmètre — voir docs/modules.md). Voir le commentaire
// sur MouvementPortefeuille dans schema.prisma pour les choix de modélisation
// et leurs limites assumées.
@Injectable()
export class PortefeuilleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvanceEnCours(livreurId: string): Promise<number> {
    const commandesEnCours = await this.prisma.commandeEmplettes.findMany({
      where: {
        modeFinancement: ModeFinancementEmplettes.avance_livreur,
        commande: { livreurId },
        statut: {
          notIn: [
            StatutEmplettes.livree,
            StatutEmplettes.annulee,
            StatutEmplettes.litige,
          ],
        },
      },
      select: { montantReel: true, budgetMax: true },
    });
    return commandesEnCours.reduce(
      (total, c) => total + Number(c.montantReel ?? c.budgetMax),
      0,
    );
  }

  async getCaisseAReverser(livreurId: string): Promise<number> {
    const result = await this.prisma.mouvementPortefeuille.aggregate({
      where: { livreurId, type: TypeMouvementPortefeuille.encaissement },
      _sum: { montant: true },
    });
    return Number(result._sum.montant ?? 0);
  }

  async verifierPlafondAvance(
    livreurId: string,
    plafondAvance: Prisma.Decimal | number,
    montantSupplementaire: number,
  ): Promise<void> {
    const enCours = await this.getAvanceEnCours(livreurId);
    if (enCours + montantSupplementaire > Number(plafondAvance)) {
      throw new BadRequestException(
        `Plafond d'avance dépassé : ${enCours} FCFA déjà avancés, plafond ${Number(plafondAvance)} FCFA.`,
      );
    }
  }

  async verifierPlafondCaisse(
    livreurId: string,
    plafondCaisse: Prisma.Decimal | number,
    montantSupplementaire: number,
  ): Promise<void> {
    const aReverser = await this.getCaisseAReverser(livreurId);
    if (aReverser + montantSupplementaire > Number(plafondCaisse)) {
      throw new BadRequestException(
        `Plafond de caisse dépassé : ${aReverser} FCFA à reverser, plafond ${Number(plafondCaisse)} FCFA. Faites régulariser votre caisse avant de reprendre une course en espèces.`,
      );
    }
  }

  async getResume(
    livreurId: string,
    plafondAvance: Prisma.Decimal | number,
    plafondCaisse: Prisma.Decimal | number,
  ) {
    const [avanceEnCours, caisseAReverser] = await Promise.all([
      this.getAvanceEnCours(livreurId),
      this.getCaisseAReverser(livreurId),
    ]);
    return {
      avanceEnCours,
      plafondAvance: Number(plafondAvance),
      caisseAReverser,
      plafondCaisse: Number(plafondCaisse),
    };
  }

  enregistrerEncaissement(
    tx: Prisma.TransactionClient,
    livreurId: string,
    commandeId: string,
    montant: number,
  ) {
    if (montant <= 0) {
      return Promise.resolve(null);
    }
    return tx.mouvementPortefeuille.create({
      data: {
        livreurId,
        commandeId,
        type: TypeMouvementPortefeuille.encaissement,
        montant,
      },
    });
  }
}
