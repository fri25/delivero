import {
  type Demandeur,
  demandeurCommande,
  estDemandeur,
  type InfosInvite,
} from '../invite/infos-invite';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutCoursesExpress,
  StatutPaiement,
  TypeService,
} from '@prisma/client';
import { PerimetreV1Service } from '../config/perimetre-v1.service';
import {
  depuisHistoriqueLivreur,
  HISTORIQUE_LIVREUR_MAX,
} from '../livreurs/periode-livreur';
import { PrismaService } from '../prisma/prisma.service';
import { AlertesLivreursService } from '../notifications/alertes-livreurs.service';
import { QuartiersService } from '../quartiers/quartiers.service';
import { tarifCoursesExpress } from '../quartiers/tarification';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { MediasService } from '../medias/medias.service';
import {
  type ContactCommande,
  NotificationsService,
} from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  marquerARembourserSiPaye,
  PAIEMENT_ENGAGE_WHERE,
} from '../paiements/paiement-engage';
import { CreateCommandeCoursesExpressDto } from './dto/create-commande-courses-express.dto';
import { DeclarerLitigeCoursesExpressDto } from './dto/declarer-litige-courses-express.dto';

const DETAIL_INCLUDE = {
  commande: {
    include: {
      client: { select: { id: true, nom: true, telephone: true } },
      paiement: { select: { mode: true, statut: true } },
      // F-CLI-08: tells the client what is left to rate.
      notations: { select: { cible: true, note: true } },
      // F-CLI-26: the client sees who delivers and can call them.
      livreur: {
        select: { user: { select: { nom: true, telephone: true } } },
      },
    },
  },
  etapes: { orderBy: { ordre: 'asc' } },
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeCoursesExpressInclude;

type CommandeCoursesExpressDetail = Prisma.CommandeCoursesExpressGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

// V11 : avant acceptation, pas de nom/téléphone client (voir même correctif
// dans commandes-repas.service.ts) ; les étapes restent visibles, ce sont
// les termes de la course elle-même, pas une donnée personnelle du client.
const DISPONIBLES_INCLUDE = {
  commande: {
    // V11 also covers guest orders (F-CLI-02): their contact lives on
    // Commande itself, so it must be omitted explicitly here.
    omit: { clientNomInvite: true, clientTelephoneInvite: true },
    include: {
      paiement: { select: { mode: true, statut: true } },
    },
  },
  etapes: { orderBy: { ordre: 'asc' } },
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeCoursesExpressInclude;

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Injectable()
export class CommandesCoursesExpressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly medias: MediasService,
    private readonly perimetre: PerimetreV1Service,
    private readonly quartiers: QuartiersService,
    private readonly alertesLivreurs: AlertesLivreursService,
  ) {}

  // F-CLI-05 : voir même principe que commandes-repas.service.ts.
  private notifierClient(
    commande: ContactCommande,
    commandeId: string,
    statut: string,
  ) {
    // Real-time refresh only exists for signed-in clients; guests poll.
    if (commande.clientId) {
      this.realtime.emitToUser(commande.clientId, 'commande:statut', {
        typeService: 'courses_express',
        commandeId,
        statut,
      });
    }
    // F-CLI-09: push or WhatsApp/SMS, key steps only (guests: WhatsApp/SMS
    // with their tracking link).
    this.notifications.commandeModifiee(
      commande,
      'courses_express',
      commandeId,
      statut,
    );
  }

  // Price = dearest stop neighbourhood × number of stops (Q-28, decided 13/10;
  // the former zone grid + 200 FCFA per extra stop is no longer used).
  async estimer(quartierIds: string[]) {
    const quartiers = await this.quartiers.resoudrePlusieurs(quartierIds);
    const tarif = tarifCoursesExpress(
      quartiers.map((q) => Number(q.fraisLivraison)),
    );
    return { nombreEtapes: quartierIds.length, tarif };
  }

  /**
   * `clientId` null + `invite` = guest order (F-CLI-02), created through
   * InviteService only — never reachable with a null clientId otherwise.
   */
  async create(
    clientId: string | null,
    dto: CreateCommandeCoursesExpressDto,
    invite?: InfosInvite,
  ) {
    this.perimetre.assertModePaiementOuvert(dto.modePaiement);
    this.medias.assertUrlsAutorisees(dto.photoUrls, 'courses');

    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }

    // Le tarif est toujours recalculé côté serveur : aucun montant envoyé
    // par le client n'est pris en compte. Prix par quartier (Q-28).
    const arrets = await Promise.all(
      dto.etapes.map((etape) =>
        this.quartiers.resoudre(etape.quartierId, etape.quartier),
      ),
    );
    const tarif = tarifCoursesExpress(
      arrets.map((a) => Number(a.quartier.fraisLivraison)),
    );

    const commandeCoursesExpress = await this.prisma.$transaction(
      async (tx) => {
        const commande = await tx.commande.create({
          data: {
            typeService: TypeService.courses_express,
            ...demandeurCommande(clientId, invite),
            montantTotal: tarif,
          },
        });

        // Le paiement doit être créé avant la lecture avec `include` ci-dessous
        // (même correctif que commandes-colis.service.ts / commandes-emplettes.service.ts).
        await tx.paiement.create({
          data: {
            commandeId: commande.id,
            montant: tarif,
            mode: dto.modePaiement,
            statut:
              dto.modePaiement === 'especes'
                ? StatutPaiement.a_percevoir_livraison
                : StatutPaiement.en_attente,
          },
        });

        return tx.commandeCoursesExpress.create({
          data: {
            commandeId: commande.id,
            description: dto.description,
            zoneId: dto.zoneId,
            photoUrls: dto.photoUrls ?? [],
            etapes: {
              create: dto.etapes.map((etape, index) => ({
                ordre: index + 1,
                description: etape.description,
                pointDeRepere: etape.pointDeRepere,
                quartierId: arrets[index].quartier.id,
                adresse:
                  [arrets[index].nom, etape.adresse?.trim()]
                    .filter(Boolean)
                    .join(' — ') || undefined,
              })),
            },
          },
          include: DETAIL_INCLUDE,
        });
      },
    );

    // Cash on delivery is engaged at once; Mobile Money waits for the
    // payment (PaiementsService alerts the livreurs then).
    if (dto.modePaiement === 'especes') {
      this.alertesLivreurs.courseDisponible(commandeCoursesExpress.commandeId);
    }
    return commandeCoursesExpress;
  }

  async findOneForUser(userId: string, role: string, id: string) {
    const commande = await this.getDetail(id);
    await this.assertCanView(userId, role, commande);
    return commande;
  }

  findAllForClient(clientId: string) {
    return this.prisma.commandeCoursesExpress.findMany({
      where: { commande: { clientId } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pas d'attribution automatique à ce stade (RG-14, Q-15 non tranché),
  // même principe que Repas/Colis/Emplettes. Filtre par zone du livreur.
  async findDisponiblesPourLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeCoursesExpress.findMany({
      where: {
        statut: StatutCoursesExpress.confirmee,
        // Unpaid Mobile Money orders are not offered to livreurs.
        commande: { livreurId: null, paiement: PAIEMENT_ENGAGE_WHERE },
        zoneId: livreur.zoneId,
      },
      include: DISPONIBLES_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeCoursesExpress.findMany({
      where: {
        commande: { livreurId: livreur.id },
        OR: [
          {
            statut: {
              notIn: [
                StatutCoursesExpress.terminee,
                StatutCoursesExpress.annulee,
              ],
            },
          },
          { commande: { updatedAt: { gte: depuisHistoriqueLivreur() } } },
        ],
      },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: HISTORIQUE_LIVREUR_MAX,
    });
  }

  // Prise en charge atomique, même garantie que Colis/Emplettes. Comme
  // Emplettes, la machine à états passe directement confirmee -> en_cours
  // (le livreur attribué est déjà "parti", voir service-courses-express.md).
  async prendreEnCharge(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    if (!livreur.disponible) {
      throw new BadRequestException(
        'Passez votre statut à disponible avant de prendre une course.',
      );
    }

    const commandeCoursesExpress =
      await this.prisma.commandeCoursesExpress.findUnique({
        where: { id },
        select: {
          commandeId: true,
          commande: {
            select: {
              id: true,
              clientId: true,
              clientTelephoneInvite: true,
              montantTotal: true,
              paiement: { select: { mode: true } },
            },
          },
        },
      });
    if (!commandeCoursesExpress) {
      throw new NotFoundException('Commande introuvable.');
    }

    // V09 / RG-02 : le cash Courses express collecté à la fin de la course
    // compte pour le plafond de caisse. Pas d'avance de fonds ici : "avance
    // pour achat simple" est [À ARBITRER] (docs/service-courses-express.md),
    // non implémentée.
    if (commandeCoursesExpress.commande.paiement?.mode === 'especes') {
      await this.portefeuille.verifierPlafondCaisse(
        livreur.id,
        livreur.plafondCaisse,
        Number(commandeCoursesExpress.commande.montantTotal ?? 0),
      );
    }

    // V02b : la zone est revalidée à l'assignation, pas seulement filtrée
    // dans la liste "disponibles".
    // Assignation et changement de statut dans une même transaction (voir
    // CommandesRepasService.prendreEnCharge).
    const updated = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.commande.updateMany({
        where: {
          id: commandeCoursesExpress.commandeId,
          // Free, or already assigned to this livreur by the dispatcher
          // (F-ADM-02/03): the assigned livreur starts it from here.
          OR: [{ livreurId: null }, { livreurId: livreur.id }],
          paiement: PAIEMENT_ENGAGE_WHERE,
          commandeCoursesExpress: {
            statut: StatutCoursesExpress.confirmee,
            zoneId: livreur.zoneId,
          },
        },
        data: { livreurId: livreur.id },
      });
      if (count === 0) {
        throw new ConflictException(
          'Cette commande a déjà été prise en charge ou n’est plus disponible.',
        );
      }

      return tx.commandeCoursesExpress.update({
        where: { id },
        data: { statut: StatutCoursesExpress.en_cours },
        include: DETAIL_INCLUDE,
      });
    });
    this.notifierClient(
      commandeCoursesExpress.commande,
      id,
      StatutCoursesExpress.en_cours,
    );
    return updated;
  }

  // Chaque étape peut être réalisée tant que la commande est en_cours ou
  // etape_realisee (auto-boucle de la machine à états : "étape suivante"),
  // jamais depuis confirmee/terminee/litige/annulee.
  async realiserEtape(userId: string, id: string, etapeId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    const commande = await this.getOwnedByLivreur(userId, id);
    if (
      commande.statut !== StatutCoursesExpress.en_cours &&
      commande.statut !== StatutCoursesExpress.etape_realisee
    ) {
      throw new ConflictException(
        `Transition impossible depuis le statut « ${commande.statut} ».`,
      );
    }

    const etape = commande.etapes.find((e) => e.id === etapeId);
    if (!etape) {
      throw new NotFoundException('Étape introuvable pour cette commande.');
    }
    if (etape.realisee) {
      throw new ConflictException('Cette étape est déjà réalisée.');
    }

    await this.prisma.etapeCourseExpress.update({
      where: { id: etapeId },
      data: { realisee: true, realiseeAt: new Date() },
    });

    const resteAFaire = commande.etapes.some(
      (e) => e.id !== etapeId && !e.realisee,
    );

    const nouveauStatut = resteAFaire
      ? StatutCoursesExpress.etape_realisee
      : StatutCoursesExpress.terminee;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.commandeCoursesExpress.update({
        where: { id },
        data: { statut: nouveauStatut },
        include: DETAIL_INCLUDE,
      });
      if (!resteAFaire && commande.commande.paiement?.mode === 'especes') {
        await this.portefeuille.enregistrerEncaissement(
          tx,
          livreur.id,
          commande.commande.id,
          Number(commande.commande.montantTotal ?? 0),
        );
      }
      return result;
    });
    this.notifierClient(commande.commande, id, nouveauStatut);
    return updated;
  }

  // Litige atteignable dans cette itération, déclaré par le livreur, sans
  // validation dispatcher (aucun back-office) — même principe que Colis et
  // Emplettes. Reachable uniquement depuis en_cours, seule transition
  // présente dans la machine à états de docs/service-courses-express.md.
  async declarerLitige(
    userId: string,
    id: string,
    dto: DeclarerLitigeCoursesExpressDto,
  ) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutCoursesExpress.en_cours);
    const updated = await this.prisma.commandeCoursesExpress.update({
      where: { id },
      data: { statut: StatutCoursesExpress.litige, motif: dto.motif },
      include: DETAIL_INCLUDE,
    });
    this.notifierClient(commande.commande, id, StatutCoursesExpress.litige);
    return updated;
  }

  // Annulation possible uniquement avant l'attribution (confirmee), conforme
  // à la machine à états de docs/service-courses-express.md.
  async annuler(demandeur: Demandeur, id: string) {
    const commande = await this.getDetail(id);
    if (!estDemandeur(commande.commande, demandeur)) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commande, StatutCoursesExpress.confirmee);
    return this.prisma.$transaction(async (tx) => {
      await marquerARembourserSiPaye(tx, commande.commandeId);
      return tx.commandeCoursesExpress.update({
        where: { id },
        data: { statut: StatutCoursesExpress.annulee },
        include: DETAIL_INCLUDE,
      });
    });
  }

  /** Guest tracking page (F-CLI-02); the caller has verified the link. */
  findOneForInvite(id: string) {
    return this.getDetail(id);
  }

  private async getDetail(id: string): Promise<CommandeCoursesExpressDetail> {
    const commande = await this.prisma.commandeCoursesExpress.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!commande) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commande;
  }

  private async getLivreurByUserId(userId: string) {
    const livreur = await this.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur) {
      throw new NotFoundException('Aucun profil livreur associé à ce compte.');
    }
    return livreur;
  }

  private async getOwnedByLivreur(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    const commande = await this.getDetail(id);
    if (commande.commande.livreurId !== livreur.id) {
      throw new ForbiddenException(
        'Cette commande ne vous a pas été attribuée.',
      );
    }
    return commande;
  }

  private async assertCanView(
    userId: string,
    role: string,
    commande: CommandeCoursesExpressDetail,
  ) {
    const isClient = commande.commande.clientId === userId;
    const isAdmin = role === ADMIN_ROLE_NAME;
    let isLivreur = false;
    if (!isClient && !isAdmin && role === 'livreur') {
      const livreur = await this.prisma.livreur.findUnique({
        where: { userId },
      });
      isLivreur =
        livreur !== null && commande.commande.livreurId === livreur.id;
    }
    if (!isClient && !isAdmin && !isLivreur) {
      throw new ForbiddenException('Accès refusé à cette commande.');
    }
  }

  private assertStatut(
    commande: CommandeCoursesExpressDetail,
    expected: StatutCoursesExpress,
  ) {
    if (commande.statut !== expected) {
      throw new ConflictException(
        `Transition impossible depuis le statut « ${commande.statut} ».`,
      );
    }
  }
}
