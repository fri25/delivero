import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { PrismaService } from '../prisma/prisma.service';
import { AlertesLivreursService } from '../notifications/alertes-livreurs.service';
import { cheminCommande } from '../notifications/messages-statut';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FedapayClient } from './fedapay.client';

const COMMANDE_SELECT = {
  id: true,
  typeService: true,
  clientId: true,
  clientNomInvite: true,
  clientTelephoneInvite: true,
  montantTotal: true,
  client: { select: { nom: true, telephone: true } },
  paiement: true,
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

type CommandePaiement = Prisma.CommandeGetPayload<{
  select: typeof COMMANDE_SELECT;
}>;

// Service statuses after which a collected payment can no longer be honoured.
const STATUTS_CLOS_SANS_PRESTATION: string[] = [
  StatutRepas.annulee,
  StatutRepas.refusee,
  StatutColis.annulee,
  StatutEmplettes.annulee,
  StatutCoursesExpress.annulee,
];

const LIBELLES_SERVICE: Record<TypeService, string> = {
  repas: 'Repas',
  colis: 'Colis',
  emplettes: 'Emplettes',
  courses_express: 'Course express',
};

export interface EtatPaiement {
  commandeId: string;
  typeService: TypeService;
  /** Id of the service-specific order (CommandeRepas.id...), used in client URLs. */
  commandeServiceId: string;
  statut: StatutPaiement;
}

@Injectable()
export class PaiementsService {
  private readonly logger = new Logger(PaiementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fedapay: FedapayClient,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly alertesLivreurs: AlertesLivreursService,
  ) {}

  /**
   * Starts (or resumes) the Mobile Money payment of an order and returns the
   * FedaPay hosted payment page. `url` is null when the order turns out to be
   * paid already (webhook arrived first).
   */
  async initier(
    userId: string,
    commandeId: string,
  ): Promise<EtatPaiement & { url: string | null }> {
    const commande = await this.getOwnedByClient(userId, commandeId);
    return this.initierCommande(commande, `/paiement/retour/${commande.id}`);
  }

  /** Guest order (F-CLI-02): the caller has verified the tracking link. */
  async initierInvite(commandeId: string, jeton: string) {
    const commande = await this.getCommandeInvite(commandeId);
    return this.initierCommande(commande, `/suivi/${jeton}/paiement`);
  }

  async synchroniserInvite(commandeId: string) {
    return this.synchroniserCommande(await this.getCommandeInvite(commandeId));
  }

  // `cheminRetour`: client app page FedaPay sends the payer back to (it
  // appends ?id=…&status=…, never trusted).
  private async initierCommande(
    commande: CommandePaiement,
    cheminRetour: string,
  ): Promise<EtatPaiement & { url: string | null }> {
    const paiement = commande.paiement;
    if (!paiement || paiement.mode !== ModePaiement.mobile_money) {
      throw new BadRequestException(
        'Cette commande ne se paie pas par Mobile Money.',
      );
    }
    if (this.estClose(commande)) {
      throw new BadRequestException('Cette commande a été annulée.');
    }
    if (
      paiement.statut !== StatutPaiement.en_attente &&
      paiement.statut !== StatutPaiement.echoue
    ) {
      throw new BadRequestException('Cette commande est déjà payée.');
    }

    // Resume the current transaction while it is still payable, so a client
    // who comes back does not end up with two open transactions.
    if (paiement.referenceTransaction) {
      const existante = await this.fedapay.lireTransaction(
        paiement.referenceTransaction,
      );
      if (existante.status === 'pending') {
        const url = await this.fedapay.genererLienPaiement(existante.id);
        return { ...this.etat(commande, paiement.statut), url };
      }
      const statut = await this.appliquerStatut(
        commande,
        paiement.referenceTransaction,
        existante.status,
      );
      if (statut === StatutPaiement.reussi) {
        return { ...this.etat(commande, statut), url: null };
      }
    }

    const { prenom, nom } = decouperNom(
      commande.client?.nom ?? commande.clientNomInvite ?? 'Client',
    );
    const transaction = await this.fedapay.creerTransaction({
      montant: Math.round(Number(paiement.montant)),
      description: `ChapExpress — ${LIBELLES_SERVICE[commande.typeService]}`,
      callbackUrl: `${this.clientAppUrl()}${cheminRetour}`,
      client: {
        prenom,
        nom,
        telephone:
          commande.client?.telephone ?? commande.clientTelephoneInvite ?? '',
      },
      metadata: { commande_id: commande.id },
    });

    await this.prisma.paiement.update({
      where: { id: paiement.id },
      data: {
        referenceTransaction: String(transaction.id),
        statut: StatutPaiement.en_attente,
      },
    });

    const url = await this.fedapay.genererLienPaiement(transaction.id);
    return { ...this.etat(commande, StatutPaiement.en_attente), url };
  }

  /**
   * Called by the client when FedaPay redirects back. The redirect's own
   * `status` query parameter is never trusted: the transaction is re-read
   * from the FedaPay API.
   */
  async synchroniser(
    userId: string,
    commandeId: string,
  ): Promise<EtatPaiement> {
    return this.synchroniserCommande(
      await this.getOwnedByClient(userId, commandeId),
    );
  }

  private async synchroniserCommande(
    commande: CommandePaiement,
  ): Promise<EtatPaiement> {
    const paiement = commande.paiement;
    if (!paiement) {
      throw new NotFoundException('Aucun paiement pour cette commande.');
    }
    if (
      !paiement.referenceTransaction ||
      paiement.mode !== ModePaiement.mobile_money
    ) {
      return this.etat(commande, paiement.statut);
    }

    const transaction = await this.fedapay.lireTransaction(
      paiement.referenceTransaction,
    );
    const statut = await this.appliquerStatut(
      commande,
      paiement.referenceTransaction,
      transaction.status,
    );
    return this.etat(commande, statut);
  }

  /** Server-to-server confirmation from FedaPay, the source of truth. */
  async traiterWebhook(corpsBrut: string | undefined, signature?: string) {
    if (
      !corpsBrut ||
      !this.fedapay.verifierSignatureWebhook(corpsBrut, signature)
    ) {
      throw new UnauthorizedException('Signature de webhook invalide.');
    }

    let evenement: { name?: string; entity?: { id?: number | string } };
    try {
      evenement = JSON.parse(corpsBrut) as typeof evenement;
    } catch {
      throw new BadRequestException('Corps de webhook illisible.');
    }

    const transactionId = evenement.entity?.id;
    if (transactionId === undefined) {
      return { recu: true };
    }

    const paiement = await this.prisma.paiement.findUnique({
      where: { referenceTransaction: String(transactionId) },
      select: { commandeId: true },
    });
    // Not ours, or superseded by a newer transaction: acknowledge and ignore,
    // otherwise FedaPay keeps retrying.
    if (!paiement) {
      return { recu: true };
    }

    const commande = await this.getCommande(paiement.commandeId);
    // Re-read rather than trust the event payload.
    const transaction = await this.fedapay.lireTransaction(transactionId);
    await this.appliquerStatut(
      commande,
      String(transactionId),
      transaction.status,
    );
    return { recu: true };
  }

  /**
   * Applies a FedaPay status to the payment, at most once per transition:
   * the webhook and the client's return can race, so each transition is a
   * conditional update on the expected previous statuses and on the
   * transaction reference (a stale transaction cannot overwrite a newer one).
   */
  private async appliquerStatut(
    commande: CommandePaiement,
    referenceTransaction: string,
    statutFedapay: string,
  ): Promise<StatutPaiement> {
    const paiement = commande.paiement!;
    const cible = this.statutCible(commande, statutFedapay);
    if (!cible || cible === paiement.statut) {
      return paiement.statut;
    }

    const precedents: StatutPaiement[] =
      cible === StatutPaiement.rembourse
        ? [StatutPaiement.reussi, StatutPaiement.a_rembourser]
        : [StatutPaiement.en_attente, StatutPaiement.echoue];

    const { count } = await this.prisma.paiement.updateMany({
      where: {
        id: paiement.id,
        referenceTransaction,
        statut: { in: precedents },
      },
      data: { statut: cible },
    });
    if (count === 0) {
      const actuel = await this.prisma.paiement.findUnique({
        where: { id: paiement.id },
        select: { statut: true },
      });
      return actuel?.statut ?? paiement.statut;
    }

    this.logger.log(
      `Paiement ${paiement.id} (commande ${commande.id}) : ${paiement.statut} -> ${cible}`,
    );
    this.notifierTransition(commande, cible);
    return cible;
  }

  private statutCible(
    commande: CommandePaiement,
    statutFedapay: string,
  ): StatutPaiement | null {
    switch (statutFedapay) {
      case 'approved':
      case 'transferred':
        // Paid after the order was cancelled (client paid a still-open
        // FedaPay page): keep the money traceable for a manual refund.
        return this.estClose(commande)
          ? StatutPaiement.a_rembourser
          : StatutPaiement.reussi;
      case 'declined':
      case 'canceled':
        return StatutPaiement.echoue;
      case 'refunded':
        return StatutPaiement.rembourse;
      default:
        return null;
    }
  }

  private notifierTransition(
    commande: CommandePaiement,
    statut: StatutPaiement,
  ) {
    const specialisation = this.specialisation(commande);
    if (commande.clientId && specialisation) {
      this.realtime.emitToUser(commande.clientId, 'commande:statut', {
        typeService: commande.typeService,
        commandeId: specialisation.id,
        statut: specialisation.statut,
      });
      if (statut === StatutPaiement.reussi) {
        this.notifications.paiementRecu(
          commande.clientId,
          cheminCommande(commande.typeService, specialisation.id),
        );
      }
    }
    if (
      !commande.clientId &&
      commande.clientTelephoneInvite &&
      statut === StatutPaiement.reussi
    ) {
      this.notifications.paiementRecuInvite(
        commande.clientTelephoneInvite,
        commande.id,
      );
    }
    // Paid Colis / Course / Emplettes are takeable right away; a paid Repas
    // goes to the restaurant first (livreurs are alerted when it is ready).
    if (statut === StatutPaiement.reussi && !commande.commandeRepas) {
      this.alertesLivreurs.courseDisponible(commande.id);
    }
    // F-RES-01: the restaurant is only alerted once the order is paid.
    if (statut === StatutPaiement.reussi && commande.commandeRepas) {
      this.realtime.emitToUser(
        commande.commandeRepas.partenaire.userId,
        'commande:nouvelle',
        { typeService: 'repas', commandeId: commande.commandeRepas.id },
      );
      this.notifications.nouvelleCommandeRestaurant(
        commande.commandeRepas.partenaire.userId,
      );
    }
  }

  private async getCommande(commandeId: string): Promise<CommandePaiement> {
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
      select: COMMANDE_SELECT,
    });
    if (!commande) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commande;
  }

  private async getCommandeInvite(commandeId: string) {
    const commande = await this.getCommande(commandeId);
    if (commande.clientId !== null) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commande;
  }

  private async getOwnedByClient(userId: string, commandeId: string) {
    const commande = await this.getCommande(commandeId);
    if (commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    return commande;
  }

  private specialisation(commande: CommandePaiement) {
    return (
      commande.commandeRepas ??
      commande.commandeColis ??
      commande.commandeEmplettes ??
      commande.commandeCoursesExpress
    );
  }

  private estClose(commande: CommandePaiement): boolean {
    const statut = this.specialisation(commande)?.statut;
    return (
      statut !== undefined && STATUTS_CLOS_SANS_PRESTATION.includes(statut)
    );
  }

  private etat(
    commande: CommandePaiement,
    statut: StatutPaiement,
  ): EtatPaiement {
    return {
      commandeId: commande.id,
      typeService: commande.typeService,
      commandeServiceId: this.specialisation(commande)?.id ?? commande.id,
      statut,
    };
  }

  private clientAppUrl(): string {
    return (this.config.get<string>('CLIENT_APP_URL') ?? '').replace(
      /\/+$/,
      '',
    );
  }
}

// FedaPay requires a first and last name; accounts only store a full name.
export function decouperNom(nomComplet: string): {
  prenom: string;
  nom: string;
} {
  const morceaux = nomComplet.trim().split(/\s+/).filter(Boolean);
  if (morceaux.length <= 1) {
    const unique = morceaux[0] ?? 'Client';
    return { prenom: unique, nom: unique };
  }
  return { prenom: morceaux[0], nom: morceaux.slice(1).join(' ') };
}
