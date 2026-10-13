import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeService } from '@prisma/client';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { JetonInviteService } from './jeton-invite.service';
import { Messagerie } from './messagerie';
import { notificationStatut, type Notification } from './messages-statut';

/** What any order carries to reach its client, signed-in or guest. */
export interface ContactCommande {
  id: string;
  clientId: string | null;
  clientTelephoneInvite: string | null;
}

export interface AbonnementPushInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * F-CLI-09 / F-RES-01 alerts. Web Push first (PWA installed, permission
 * granted); WhatsApp/SMS whenever no push could be delivered — the fallback
 * is mandatory, not optional (local constraint: iOS push support is partial,
 * partners are poorly equipped).
 *
 * Every public method is fire-and-forget for callers: a notification failure
 * must never fail the business action that triggered it.
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private pushActif = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagerie: Messagerie,
    private readonly jetonInvite: JetonInviteService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const publique = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privee = this.config.get<string>('VAPID_PRIVATE_KEY');
    if (publique && privee) {
      webpush.setVapidDetails(
        this.config.get<string>('VAPID_SUBJECT') ??
          'mailto:contact@chapexpress.bj',
        publique,
        privee,
      );
      this.pushActif = true;
    } else {
      this.logger.warn(
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY absentes : Web Push désactivé, repli WhatsApp/SMS seul.',
      );
    }
  }

  clePubliquePush(): string | null {
    return this.pushActif
      ? (this.config.get<string>('VAPID_PUBLIC_KEY') ?? null)
      : null;
  }

  async abonner(userId: string, abonnement: AbonnementPushInput) {
    // Same browser re-subscribing (or another account on a shared phone):
    // the endpoint follows whoever subscribed last.
    await this.prisma.abonnementPush.upsert({
      where: { endpoint: abonnement.endpoint },
      create: {
        userId,
        endpoint: abonnement.endpoint,
        p256dh: abonnement.keys.p256dh,
        auth: abonnement.keys.auth,
      },
      update: {
        userId,
        p256dh: abonnement.keys.p256dh,
        auth: abonnement.keys.auth,
      },
    });
  }

  async desabonner(userId: string, endpoint: string) {
    await this.prisma.abonnementPush.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Status change of any order — signed-in client (push, then WhatsApp/SMS)
   * or guest (WhatsApp/SMS with the tracking link, F-CLI-02).
   */
  commandeModifiee(
    commande: ContactCommande,
    typeService: TypeService,
    commandeServiceId: string,
    statut: string,
  ) {
    if (commande.clientId) {
      this.statutCommande(
        commande.clientId,
        typeService,
        commandeServiceId,
        statut,
      );
      return;
    }
    const notification = notificationStatut(
      typeService,
      commandeServiceId,
      statut,
    );
    if (notification && commande.clientTelephoneInvite) {
      this.envoyerInviteEnArrierePlan(
        commande.clientTelephoneInvite,
        commande.id,
        notification,
      );
    }
  }

  /** Right after a guest order: the link is the only way back to it. */
  commandeInviteCreee(telephone: string, commandeId: string) {
    this.envoyerInviteEnArrierePlan(telephone, commandeId, {
      titre: 'Commande enregistrée',
      message: 'Payez et suivez votre commande ici',
    });
  }

  paiementRecuInvite(telephone: string, commandeId: string) {
    this.envoyerInviteEnArrierePlan(telephone, commandeId, {
      titre: 'Paiement reçu',
      message: 'Votre commande est transmise. Suivi',
    });
  }

  /** Order status change, for the client — only key steps are sent. */
  statutCommande(
    clientId: string,
    typeService: TypeService,
    commandeServiceId: string,
    statut: string,
  ) {
    const notification = notificationStatut(
      typeService,
      commandeServiceId,
      statut,
    );
    if (notification) {
      this.envoyerEnArrierePlan(clientId, notification);
    }
  }

  paiementRecu(clientId: string, url: string) {
    this.envoyerEnArrierePlan(clientId, {
      titre: 'Paiement reçu',
      message: 'Votre commande est transmise.',
      url,
    });
  }

  /**
   * Cancelled by the dispatcher (F-ADM-06): the client hears it, with the
   * reason, through push then WhatsApp/SMS (or the guest link).
   */
  commandeAnnuleeParChapExpress(commande: ContactCommande, motif: string) {
    const notification: Notification = {
      titre: 'Commande annulée',
      message: `ChapExpress a annulé votre commande (${motif}). Si vous avez payé, vous serez remboursé.`,
    };
    if (commande.clientId) {
      this.envoyerEnArrierePlan(commande.clientId, notification);
    } else if (commande.clientTelephoneInvite) {
      this.envoyerInviteEnArrierePlan(
        commande.clientTelephoneInvite,
        commande.id,
        notification,
      );
    }
  }

  /** Manual refund sent (F-ADM-06): amount and Mobile Money reference. */
  remboursementEffectue(
    commande: ContactCommande,
    montant: string,
    reference: string | null,
  ) {
    const notification: Notification = {
      titre: 'Remboursement envoyé',
      message: `${montant} FCFA vous ont été renvoyés par Mobile Money${reference ? ` (réf. ${reference})` : ''}.`,
    };
    if (commande.clientId) {
      this.envoyerEnArrierePlan(commande.clientId, notification);
    } else if (commande.clientTelephoneInvite) {
      this.envoyerInviteEnArrierePlan(
        commande.clientTelephoneInvite,
        commande.id,
        notification,
      );
    }
  }

  /** F-RES-01: new paid order for a restaurant. */
  nouvelleCommandeRestaurant(partenaireUserId: string) {
    this.envoyerEnArrierePlan(partenaireUserId, {
      titre: 'Nouvelle commande',
      message: 'Une nouvelle commande ChapExpress attend votre acceptation.',
    });
  }

  /**
   * New order a livreur could take. Push only, no WhatsApp/SMS fallback: one
   * SMS per new order to every livreur of the zone would cost money and soon
   * be ignored; the in-app list (real-time + polling) is the source of truth.
   */
  courseDisponibleLivreur(livreurUserId: string, notification: Notification) {
    void this.envoyerPush(livreurUserId, notification).catch((error: unknown) =>
      this.logger.error(`Alerte livreur non envoyée à ${livreurUserId}`, error),
    );
  }

  /** Order assigned by the dispatcher (F-ADM-02/03): push, then WhatsApp/SMS. */
  courseAttribueeLivreur(livreurUserId: string) {
    this.envoyerEnArrierePlan(livreurUserId, {
      titre: 'Course attribuée',
      message:
        'Le dispatch vous a attribué une course : ouvrez l’onglet En cours.',
      url: '/en-cours',
    });
  }

  // Guests have no account, hence no push: WhatsApp/SMS only, with the link.
  private envoyerInviteEnArrierePlan(
    telephone: string,
    commandeId: string,
    notification: Notification,
  ) {
    const texte = `ChapExpress — ${notification.titre} : ${notification.message} ${this.jetonInvite.lien(commandeId)}`;
    void this.messagerie
      .envoyer(telephone, texte)
      .catch((error: unknown) =>
        this.logger.error(
          `Notification invité non envoyée (${commandeId})`,
          error,
        ),
      );
  }

  private envoyerEnArrierePlan(userId: string, notification: Notification) {
    void this.notifier(userId, notification).catch((error: unknown) =>
      this.logger.error(`Notification non envoyée à ${userId}`, error),
    );
  }

  private async notifier(userId: string, notification: Notification) {
    const recuParPush = await this.envoyerPush(userId, notification);
    if (recuParPush) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telephone: true },
    });
    if (!user) {
      return;
    }
    await this.messagerie.envoyer(
      user.telephone,
      `ChapExpress — ${notification.titre} : ${notification.message}`,
    );
  }

  /** True when at least one of the user's devices accepted the push. */
  private async envoyerPush(
    userId: string,
    notification: Notification,
  ): Promise<boolean> {
    if (!this.pushActif) {
      return false;
    }
    const abonnements = await this.prisma.abonnementPush.findMany({
      where: { userId },
    });
    const payload = JSON.stringify(notification);

    const resultats = await Promise.all(
      abonnements.map(async (abonnement) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: abonnement.endpoint,
              keys: { p256dh: abonnement.p256dh, auth: abonnement.auth },
            },
            payload,
            // A status alert is useless after a few hours.
            { TTL: 4 * 60 * 60 },
          );
          return true;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          // 404/410: subscription revoked or expired, forget it.
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.abonnementPush.deleteMany({
              where: { id: abonnement.id },
            });
          } else {
            this.logger.warn(
              `Push refusé (${statusCode ?? 'erreur réseau'}) pour ${userId}`,
            );
          }
          return false;
        }
      }),
    );
    return resultats.some(Boolean);
  }
}
