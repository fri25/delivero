import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutPaiement,
  StatutRepas,
  TypeService,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { marquerARembourserSiPaye } from '../paiements/paiement-engage';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AnnulerCommandeDto } from './dto/annuler-commande.dto';
import { RembourserDto } from './dto/rembourser.dto';

// F-ADM-06 — incidents handled by the dispatcher: cancellation and manual
// refund. Decisions of 2026-10-13 (Q-13 / RG-09):
// - the dispatcher may cancel only before work starts: Repas before the
//   kitchen starts (awaiting acceptance or accepted), the other services
//   before a livreur has taken the order on;
// - a collected payment becomes `a_rembourser`; the dispatcher sends the
//   money by hand and may refund less than paid (e.g. delivery fee kept),
//   the reason being then required.

/** Statuses from which the dispatcher may still cancel, per service. */
export const STATUTS_ANNULABLES: Record<TypeService, string[]> = {
  repas: [StatutRepas.en_attente_acceptation, StatutRepas.confirmee],
  colis: [StatutColis.confirmee],
  courses_express: [StatutCoursesExpress.confirmee],
  emplettes: [StatutEmplettes.confirmee],
};

const ANNULATION_SELECT = {
  id: true,
  typeService: true,
  clientId: true,
  clientTelephoneInvite: true,
  clientEmailInvite: true,
  livreur: { select: { userId: true } },
  commandeRepas: {
    select: {
      id: true,
      statut: true,
      partenaire: { select: { userId: true } },
    },
  },
  commandeColis: { select: { id: true, statut: true } },
  commandeEmplettes: { select: { id: true, statut: true } },
  commandeCoursesExpress: { select: { id: true, statut: true } },
} satisfies Prisma.CommandeSelect;

type CommandeAnnulable = Prisma.CommandeGetPayload<{
  select: typeof ANNULATION_SELECT;
}>;

function specialisation(commande: CommandeAnnulable) {
  switch (commande.typeService) {
    case TypeService.repas:
      return commande.commandeRepas;
    case TypeService.colis:
      return commande.commandeColis;
    case TypeService.emplettes:
      return commande.commandeEmplettes;
    case TypeService.courses_express:
      return commande.commandeCoursesExpress;
  }
}

const REMBOURSEMENT_SELECT = {
  id: true,
  montant: true,
  mode: true,
  statut: true,
  referenceTransaction: true,
  createdAt: true,
  montantRembourse: true,
  referenceRemboursement: true,
  motifRemboursement: true,
  rembourseAt: true,
  remboursePar: { select: { nom: true } },
  commande: {
    select: {
      id: true,
      typeService: true,
      createdAt: true,
      clientId: true,
      clientNomInvite: true,
      clientTelephoneInvite: true,
      clientEmailInvite: true,
      client: { select: { nom: true, telephone: true } },
      motifAnnulation: true,
      annuleeAt: true,
      annuleePar: { select: { nom: true } },
      commandeRepas: {
        select: {
          statut: true,
          motifRefus: true,
          partenaire: { select: { nom: true } },
        },
      },
      commandeColis: { select: { statut: true } },
      commandeEmplettes: { select: { statut: true } },
      commandeCoursesExpress: { select: { statut: true } },
    },
  },
} satisfies Prisma.PaiementSelect;

@Injectable()
export class AdminIncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async annuler(commandeId: string, dto: AnnulerCommandeDto, adminId: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
      select: ANNULATION_SELECT,
    });
    const service = commande && specialisation(commande);
    if (!commande || !service) {
      throw new NotFoundException('Commande introuvable.');
    }
    if (!STATUTS_ANNULABLES[commande.typeService].includes(service.statut)) {
      throw new BadRequestException(
        'Cette commande est déjà en cours de préparation ou de livraison : elle ne peut plus être annulée.',
      );
    }

    const motif = dto.motif.trim();
    await this.prisma.$transaction(async (tx) => {
      // Status condition repeated in the update: a restaurant or a livreur
      // acting at the same moment wins, and the cancellation is refused.
      const count = await this.annulerSpecialisation(tx, commande);
      if (count === 0) {
        throw new BadRequestException(
          'La commande vient de changer de statut : rechargez avant de réessayer.',
        );
      }
      await marquerARembourserSiPaye(tx, commande.id);
      await tx.commande.update({
        where: { id: commande.id },
        data: {
          motifAnnulation: motif,
          annuleeAt: new Date(),
          annuleeParId: adminId,
        },
      });
    });

    const evenement = {
      typeService: commande.typeService,
      commandeId: service.id,
      statut: 'annulee',
    };
    if (commande.clientId) {
      this.realtime.emitToUser(commande.clientId, 'commande:statut', evenement);
    }
    if (commande.commandeRepas) {
      this.realtime.emitToUser(
        commande.commandeRepas.partenaire.userId,
        'commande:statut',
        evenement,
      );
    }
    if (commande.livreur) {
      this.realtime.emitToUser(
        commande.livreur.userId,
        'livreur:course-annulee',
        evenement,
      );
    }
    this.notifications.commandeAnnuleeParChapExpress(commande, motif);

    return { id: commande.id, statut: 'annulee', motifAnnulation: motif };
  }

  private async annulerSpecialisation(
    tx: Prisma.TransactionClient,
    commande: CommandeAnnulable,
  ): Promise<number> {
    if (commande.commandeRepas) {
      const { id, statut } = commande.commandeRepas;
      return (
        await tx.commandeRepas.updateMany({
          where: { id, statut },
          data: { statut: StatutRepas.annulee },
        })
      ).count;
    }
    if (commande.commandeColis) {
      const { id, statut } = commande.commandeColis;
      return (
        await tx.commandeColis.updateMany({
          where: { id, statut },
          data: { statut: StatutColis.annulee },
        })
      ).count;
    }
    if (commande.commandeEmplettes) {
      const { id, statut } = commande.commandeEmplettes;
      return (
        await tx.commandeEmplettes.updateMany({
          where: { id, statut },
          data: { statut: StatutEmplettes.annulee },
        })
      ).count;
    }
    if (commande.commandeCoursesExpress) {
      const { id, statut } = commande.commandeCoursesExpress;
      return (
        await tx.commandeCoursesExpress.updateMany({
          where: { id, statut },
          data: { statut: StatutCoursesExpress.annulee },
        })
      ).count;
    }
    return 0;
  }

  /** Payments to refund first (oldest first), then the last ones refunded. */
  async listerRemboursements() {
    const [aRembourser, rembourses] = await Promise.all([
      this.prisma.paiement.findMany({
        where: { statut: StatutPaiement.a_rembourser },
        select: REMBOURSEMENT_SELECT,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.paiement.findMany({
        where: { statut: StatutPaiement.rembourse },
        select: REMBOURSEMENT_SELECT,
        orderBy: { rembourseAt: 'desc' },
        take: 50,
      }),
    ]);
    return { aRembourser, rembourses };
  }

  async rembourser(paiementId: string, dto: RembourserDto, adminId: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id: paiementId },
      select: {
        id: true,
        montant: true,
        statut: true,
        commande: {
          select: {
            id: true,
            clientId: true,
            clientTelephoneInvite: true,
            clientEmailInvite: true,
          },
        },
      },
    });
    if (!paiement) {
      throw new NotFoundException('Paiement introuvable.');
    }
    if (paiement.statut !== StatutPaiement.a_rembourser) {
      throw new BadRequestException("Ce paiement n'est pas à rembourser.");
    }
    const montant = new Prisma.Decimal(dto.montantRembourse);
    if (montant.gt(paiement.montant)) {
      throw new BadRequestException(
        'Le montant remboursé ne peut pas dépasser le montant payé.',
      );
    }
    const partiel = montant.lt(paiement.montant);
    const motif = dto.motif?.trim() || null;
    if (partiel && !motif) {
      throw new BadRequestException(
        'Indiquez pourquoi le remboursement est inférieur au montant payé.',
      );
    }
    const reference = dto.reference?.trim() || null;
    if (montant.gt(0) && !reference) {
      throw new BadRequestException(
        "Indiquez la référence de l'envoi Mobile Money.",
      );
    }

    const { count } = await this.prisma.paiement.updateMany({
      where: { id: paiement.id, statut: StatutPaiement.a_rembourser },
      data: {
        statut: StatutPaiement.rembourse,
        montantRembourse: montant,
        referenceRemboursement: reference,
        motifRemboursement: motif,
        rembourseAt: new Date(),
        rembourseParId: adminId,
      },
    });
    if (count === 0) {
      throw new BadRequestException('Ce paiement vient déjà d’être traité.');
    }
    if (montant.gt(0)) {
      this.notifications.remboursementEffectue(
        paiement.commande,
        montant.toFixed(0),
        reference,
      );
    }
    return this.prisma.paiement.findUniqueOrThrow({
      where: { id: paiement.id },
      select: REMBOURSEMENT_SELECT,
    });
  }
}
