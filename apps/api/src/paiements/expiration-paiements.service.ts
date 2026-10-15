import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  ModePaiement,
  Prisma,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutPaiement,
  StatutRepas,
  TypeService,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PaiementsService } from './paiements.service';

// Decision of 2026-10-13: a Mobile Money order still unpaid 30 minutes after
// it was placed is cancelled. Nobody but the client (or the dispatcher) ever
// saw it, so nothing else needs undoing. A payment that lands afterwards is
// kept for a manual refund (see PaiementsService.statutCible).
export const DELAI_EXPIRATION_MS = 30 * 60_000;
export const MOTIF_EXPIRATION = 'paiement non reçu dans les 30 minutes';

const INTERVALLE_MS = 60_000;
const LOT = 50;

const STATUTS_NON_PAYES: StatutPaiement[] = [
  StatutPaiement.en_attente,
  StatutPaiement.echoue,
];

// An unpaid order cannot move (restaurant and livreurs never see it), so it
// is still in its creation status.
const EN_ATTENTE_DE_PAIEMENT = {
  paiement: {
    is: { statut: { in: STATUTS_NON_PAYES } },
  },
} satisfies Prisma.CommandeWhereInput;

const EXPIRABLE_SELECT = {
  id: true,
  typeService: true,
  clientId: true,
  clientTelephoneInvite: true,
  clientEmailInvite: true,
  paiement: { select: { referenceTransaction: true } },
  commandeRepas: { select: { id: true } },
  commandeColis: { select: { id: true } },
  commandeEmplettes: { select: { id: true } },
  commandeCoursesExpress: { select: { id: true } },
} satisfies Prisma.CommandeSelect;

type CommandeExpirable = Prisma.CommandeGetPayload<{
  select: typeof EXPIRABLE_SELECT;
}>;

@Injectable()
export class ExpirationPaiementsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ExpirationPaiementsService.name);
  private minuterie?: NodeJS.Timeout;
  private enCours = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paiements: PaiementsService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    this.minuterie = setInterval(() => void this.executer(), INTERVALLE_MS);
    this.minuterie.unref();
  }

  onModuleDestroy() {
    clearInterval(this.minuterie);
  }

  /** One pass; returns the number of orders cancelled. */
  async executer(maintenant = new Date()): Promise<number> {
    if (this.enCours) {
      return 0;
    }
    this.enCours = true;
    try {
      const commandes = await this.prisma.commande.findMany({
        where: {
          paiement: {
            is: {
              mode: ModePaiement.mobile_money,
              statut: { in: STATUTS_NON_PAYES },
              createdAt: {
                lt: new Date(maintenant.getTime() - DELAI_EXPIRATION_MS),
              },
            },
          },
          OR: [
            { commandeRepas: { statut: StatutRepas.en_attente_acceptation } },
            { commandeColis: { statut: StatutColis.confirmee } },
            { commandeEmplettes: { statut: StatutEmplettes.confirmee } },
            {
              commandeCoursesExpress: {
                statut: StatutCoursesExpress.confirmee,
              },
            },
          ],
        },
        select: EXPIRABLE_SELECT,
        orderBy: { createdAt: 'asc' },
        take: LOT,
      });

      let annulees = 0;
      for (const commande of commandes) {
        try {
          if (await this.expirer(commande, maintenant)) {
            annulees += 1;
          }
        } catch (error) {
          this.logger.warn(
            `Expiration de la commande ${commande.id} reportée : ${(error as Error).message}`,
          );
        }
      }
      if (annulees > 0) {
        this.logger.log(`${annulees} commande(s) non payée(s) annulée(s)`);
      }
      return annulees;
    } finally {
      this.enCours = false;
    }
  }

  private async expirer(
    commande: CommandeExpirable,
    maintenant: Date,
  ): Promise<boolean> {
    // A FedaPay page was opened: the webhook may have been lost. Re-read the
    // transaction first; if FedaPay cannot be reached, this throws and the
    // order is retried on the next pass.
    if (commande.paiement?.referenceTransaction) {
      const statut = await this.paiements.resynchroniser(commande.id);
      if (!STATUTS_NON_PAYES.includes(statut)) {
        return false;
      }
    }

    const annulee = await this.prisma.$transaction(async (tx) => {
      // Conditional on the payment still being unpaid: a payment confirmed
      // at the same moment (webhook, dispatcher) wins.
      const count = await this.annulerSpecialisation(tx, commande);
      if (count === 0) {
        return false;
      }
      await tx.commande.update({
        where: { id: commande.id },
        data: { motifAnnulation: MOTIF_EXPIRATION, annuleeAt: maintenant },
      });
      return true;
    });
    if (!annulee) {
      return false;
    }

    const specialisation =
      commande.commandeRepas ??
      commande.commandeColis ??
      commande.commandeEmplettes ??
      commande.commandeCoursesExpress;
    if (commande.clientId && specialisation) {
      this.realtime.emitToUser(commande.clientId, 'commande:statut', {
        typeService: commande.typeService,
        commandeId: specialisation.id,
        statut: 'annulee',
      });
    }
    this.notifications.commandeAnnuleeParChapExpress(
      commande,
      MOTIF_EXPIRATION,
    );
    return true;
  }

  private async annulerSpecialisation(
    tx: Prisma.TransactionClient,
    commande: CommandeExpirable,
  ): Promise<number> {
    const where = { commandeId: commande.id, commande: EN_ATTENTE_DE_PAIEMENT };
    switch (commande.typeService) {
      case TypeService.repas:
        return (
          await tx.commandeRepas.updateMany({
            where: { ...where, statut: StatutRepas.en_attente_acceptation },
            data: { statut: StatutRepas.annulee },
          })
        ).count;
      case TypeService.colis:
        return (
          await tx.commandeColis.updateMany({
            where: { ...where, statut: StatutColis.confirmee },
            data: { statut: StatutColis.annulee },
          })
        ).count;
      case TypeService.emplettes:
        return (
          await tx.commandeEmplettes.updateMany({
            where: { ...where, statut: StatutEmplettes.confirmee },
            data: { statut: StatutEmplettes.annulee },
          })
        ).count;
      case TypeService.courses_express:
        return (
          await tx.commandeCoursesExpress.updateMany({
            where: { ...where, statut: StatutCoursesExpress.confirmee },
            data: { statut: StatutCoursesExpress.annulee },
          })
        ).count;
    }
  }
}
