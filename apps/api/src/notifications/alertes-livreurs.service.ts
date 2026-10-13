import { Injectable, Logger } from '@nestjs/common';
import { TypeService } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from './notifications.service';

const LIBELLES: Record<TypeService, string> = {
  repas: 'Repas à livrer',
  colis: 'Colis à enlever',
  courses_express: 'Course en ville',
  emplettes: 'Emplettes à faire',
};

/** Real-time event the livreur app listens to (refreshes its lists). */
export const EVENEMENT_COURSE_DISPONIBLE = 'livreur:course-disponible';
export const EVENEMENT_COURSE_ATTRIBUEE = 'livreur:course-attribuee';

/**
 * Tells livreurs that work is waiting (decision of 13/10: alert on new
 * course). Called when an order becomes takeable — Repas marked ready by the
 * restaurant, Colis / Course / Emplettes once paid — and when the dispatcher
 * assigns one. Every method is fire-and-forget: an alert failure must never
 * fail the business action that triggered it.
 */
@Injectable()
export class AlertesLivreursService {
  private readonly logger = new Logger(AlertesLivreursService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  /** `commandeId`: the generic Commande id. */
  courseDisponible(commandeId: string) {
    void this.diffuser(commandeId).catch((error: unknown) =>
      this.logger.error(
        `Alerte « course disponible » non diffusée (${commandeId})`,
        error,
      ),
    );
  }

  /** The dispatcher gave this order to this livreur (F-ADM-02/03). */
  courseAttribuee(livreurUserId: string, commandeId: string) {
    this.realtime.emitToUser(livreurUserId, EVENEMENT_COURSE_ATTRIBUEE, {
      commandeId,
    });
    this.notifications.courseAttribueeLivreur(livreurUserId);
  }

  private async diffuser(commandeId: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
      select: {
        typeService: true,
        livreurId: true,
        commandeRepas: { select: { partenaire: { select: { zoneId: true } } } },
        commandeColis: { select: { zoneId: true, programmationAt: true } },
        commandeCoursesExpress: { select: { zoneId: true } },
        commandeEmplettes: { select: { zoneId: true } },
      },
    });
    // Already assigned: it will not appear in anyone's "À prendre" list.
    if (!commande || commande.livreurId) return;
    // Scheduled pick-up still in the future: not offered yet (same rule as
    // CommandesColisService.findDisponiblesPourLivreur).
    const programmation = commande.commandeColis?.programmationAt;
    if (programmation && programmation.getTime() > Date.now()) return;

    const zoneId =
      commande.commandeRepas?.partenaire.zoneId ??
      commande.commandeColis?.zoneId ??
      commande.commandeCoursesExpress?.zoneId ??
      commande.commandeEmplettes?.zoneId;
    if (!zoneId) return;

    // Same zone as the livreurs' "disponibles" lists.
    const livreurs = await this.prisma.livreur.findMany({
      where: { zoneId },
      select: { userId: true, disponible: true },
    });
    for (const livreur of livreurs) {
      // Every livreur of the zone refreshes its list; only available ones
      // are disturbed by a phone notification.
      this.realtime.emitToUser(livreur.userId, EVENEMENT_COURSE_DISPONIBLE, {
        typeService: commande.typeService,
      });
      if (livreur.disponible) {
        this.notifications.courseDisponibleLivreur(livreur.userId, {
          titre: 'Nouvelle course',
          message: `${LIBELLES[commande.typeService]} : ouvrez ChapExpress Livreur pour la prendre.`,
          url: '/',
        });
      }
    }
  }
}
