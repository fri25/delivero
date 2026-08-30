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
// moment de l'attribution d'une course. Voir le commentaire sur
// MouvementPortefeuille et ClotureCaisse dans schema.prisma pour les choix de
// modélisation et leurs limites assumées.
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

  // Seuls les encaissements pas encore rattachés à une ClotureCaisse comptent
  // — une fois clôturés (F-ADM-13), ils sortent du solde courant. Voir le
  // commentaire sur MouvementPortefeuille dans schema.prisma.
  async getCaisseAReverser(livreurId: string): Promise<number> {
    const result = await this.prisma.mouvementPortefeuille.aggregate({
      where: {
        livreurId,
        type: TypeMouvementPortefeuille.encaissement,
        clotureCaisseId: null,
      },
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

  // Clôture journalière (RG-03, F-ADM-13) : fige les encaissements pas
  // encore clôturés sur une nouvelle ClotureCaisse et compare au montant
  // déclaré par le livreur. Ne corrige ni ne bloque rien en cas d'écart —
  // la procédure exacte reste [À ARBITRER] (docs/regles-gestion.md RG-03),
  // le rapprochement (F-ADM-12) n'est qu'une prise d'acte du dispatcher.
  // "Journalière" est simplifié en une clôture par jour calendaire UTC (pas
  // de fuseau propre au projet configuré) — [DÉDUIT], pas une exigence
  // confirmée.
  async cloturerCaisse(livreurId: string, montantDeclare: number) {
    const debutJournee = new Date();
    debutJournee.setUTCHours(0, 0, 0, 0);

    const clotureExistante = await this.prisma.clotureCaisse.findFirst({
      where: { livreurId, createdAt: { gte: debutJournee } },
    });
    if (clotureExistante) {
      throw new BadRequestException(
        'La caisse a déjà été clôturée aujourd\'hui.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const mouvementsOuverts = await tx.mouvementPortefeuille.findMany({
        where: {
          livreurId,
          type: TypeMouvementPortefeuille.encaissement,
          clotureCaisseId: null,
        },
        select: { id: true, montant: true },
      });
      const montantTheorique = mouvementsOuverts.reduce(
        (total, m) => total + Number(m.montant),
        0,
      );

      const cloture = await tx.clotureCaisse.create({
        data: {
          livreurId,
          montantTheorique,
          montantDeclare,
          ecart: montantDeclare - montantTheorique,
        },
      });

      if (mouvementsOuverts.length > 0) {
        await tx.mouvementPortefeuille.updateMany({
          where: { id: { in: mouvementsOuverts.map((m) => m.id) } },
          data: { clotureCaisseId: cloture.id },
        });
      }

      return cloture;
    });
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
