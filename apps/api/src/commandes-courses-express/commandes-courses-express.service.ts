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
import { PrismaService } from '../prisma/prisma.service';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCommandeCoursesExpressDto } from './dto/create-commande-courses-express.dto';
import { DeclarerLitigeCoursesExpressDto } from './dto/declarer-litige-courses-express.dto';

const DETAIL_INCLUDE = {
  commande: {
    include: {
      client: { select: { id: true, nom: true, telephone: true } },
      paiement: { select: { mode: true, statut: true } },
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
    include: {
      paiement: { select: { mode: true, statut: true } },
    },
  },
  etapes: { orderBy: { ordre: 'asc' } },
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeCoursesExpressInclude;

const ADMIN_ROLE_NAME = 'admin_dispatcher';

// Majoration provisoire par arrêt supplémentaire, appliquée au tarif de base
// par zone (GrilleTarifaireCoursesExpress.tarifBase, lui-même provisoire).
// Vit en code, pas en base — même statut que MAJORATION_TAILLE côté Colis.
const MAJORATION_PAR_ARRET_SUPPLEMENTAIRE = 200;

@Injectable()
export class CommandesCoursesExpressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // F-CLI-05 : voir même principe que commandes-repas.service.ts.
  private notifierClient(clientId: string, commandeId: string, statut: string) {
    this.realtime.emitToUser(clientId, 'commande:statut', {
      typeService: 'courses_express',
      commandeId,
      statut,
    });
  }

  async estimer(zoneId: string, nombreEtapes: number) {
    const tarif = await this.calculerTarif(zoneId, nombreEtapes);
    return { zoneId, nombreEtapes, tarif };
  }

  async create(clientId: string, dto: CreateCommandeCoursesExpressDto) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }

    // Le tarif est toujours recalculé côté serveur : aucun montant envoyé
    // par le client n'est pris en compte.
    const tarif = await this.calculerTarif(dto.zoneId, dto.etapes.length);

    const commandeCoursesExpress = await this.prisma.$transaction(
      async (tx) => {
        const commande = await tx.commande.create({
          data: {
            typeService: TypeService.courses_express,
            clientId,
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
            etapes: {
              create: dto.etapes.map((etape, index) => ({
                ordre: index + 1,
                description: etape.description,
                pointDeRepere: etape.pointDeRepere,
                adresse: etape.adresse,
              })),
            },
          },
          include: DETAIL_INCLUDE,
        });
      },
    );

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
        commande: { livreurId: null },
        zoneId: livreur.zoneId,
      },
      include: DISPONIBLES_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeCoursesExpress.findMany({
      where: { commande: { livreurId: livreur.id } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
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
              clientId: true,
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
    const { count } = await this.prisma.commande.updateMany({
      where: {
        id: commandeCoursesExpress.commandeId,
        livreurId: null,
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

    const updated = await this.prisma.commandeCoursesExpress.update({
      where: { id },
      data: { statut: StatutCoursesExpress.en_cours },
      include: DETAIL_INCLUDE,
    });
    if (commandeCoursesExpress.commande.clientId) {
      this.notifierClient(
        commandeCoursesExpress.commande.clientId,
        id,
        StatutCoursesExpress.en_cours,
      );
    }
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
    if (commande.commande.clientId) {
      this.notifierClient(commande.commande.clientId, id, nouveauStatut);
    }
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
    if (commande.commande.clientId) {
      this.notifierClient(
        commande.commande.clientId,
        id,
        StatutCoursesExpress.litige,
      );
    }
    return updated;
  }

  // Annulation possible uniquement avant l'attribution (confirmee), conforme
  // à la machine à états de docs/service-courses-express.md.
  async annuler(userId: string, id: string) {
    const commande = await this.getDetail(id);
    if (commande.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commande, StatutCoursesExpress.confirmee);
    return this.prisma.commandeCoursesExpress.update({
      where: { id },
      data: { statut: StatutCoursesExpress.annulee },
      include: DETAIL_INCLUDE,
    });
  }

  private async calculerTarif(zoneId: string, nombreEtapes: number) {
    const grille = await this.prisma.grilleTarifaireCoursesExpress.findUnique({
      where: { zoneId },
    });
    if (!grille) {
      throw new NotFoundException(
        'Aucune grille tarifaire Courses express pour cette zone.',
      );
    }
    const arretsSupplementaires = Math.max(0, nombreEtapes - 1);
    return (
      Math.round(Number(grille.tarifBase)) +
      arretsSupplementaires * MAJORATION_PAR_ARRET_SUPPLEMENTAIRE
    );
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
