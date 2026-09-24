import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutPaiement,
  StatutRepas,
  TypePartenaire,
  TypeService,
} from '@prisma/client';
import { PerimetreV1Service } from '../config/perimetre-v1.service';
import { PrismaService } from '../prisma/prisma.service';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCommandeRepasDto } from './dto/create-commande-repas.dto';

const DETAIL_INCLUDE = {
  commande: {
    include: {
      adresse: true,
      client: { select: { id: true, nom: true, telephone: true } },
      paiement: { select: { mode: true, statut: true } },
    },
  },
  partenaire: {
    select: {
      id: true,
      nom: true,
      userId: true,
      adresse: true,
      pointDeRepere: true,
    },
  },
  lignes: { include: { plat: { select: { id: true, nom: true } } } },
} satisfies Prisma.CommandeRepasInclude;

type CommandeRepasDetail = Prisma.CommandeRepasGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

// V11 : avant acceptation, un livreur ne doit pas voir le nom/téléphone du
// client (contact direct possible hors plateforme) — seule l'adresse
// (point de repère) reste nécessaire pour juger de la faisabilité de la
// course. Le contact complet redevient visible une fois la course prise
// (voir DETAIL_INCLUDE, utilisé par getOwnedByLivreur).
const DISPONIBLES_INCLUDE = {
  commande: {
    include: {
      adresse: true,
      paiement: { select: { mode: true, statut: true } },
    },
  },
  partenaire: {
    select: {
      id: true,
      nom: true,
      userId: true,
      adresse: true,
      pointDeRepere: true,
    },
  },
  lignes: { include: { plat: { select: { id: true, nom: true } } } },
} satisfies Prisma.CommandeRepasInclude;

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Injectable()
export class CommandesRepasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
    private readonly realtime: RealtimeGateway,
    private readonly perimetre: PerimetreV1Service,
  ) {}

  // F-CLI-05 : notifie le client d'un changement de statut, pour remplacer
  // le polling par un rafraîchissement immédiat côté front (le polling
  // reste en place comme filet de secours, voir realtime.gateway.ts).
  private notifierClient(clientId: string, commandeId: string, statut: string) {
    this.realtime.emitToUser(clientId, 'commande:statut', {
      typeService: 'repas',
      commandeId,
      statut,
    });
  }

  async create(clientId: string, dto: CreateCommandeRepasDto) {
    this.perimetre.assertModePaiementOuvert(dto.modePaiement);

    const partenaire = await this.prisma.partenaire.findFirst({
      where: { id: dto.partenaireId, type: TypePartenaire.restaurant },
      include: { zone: true },
    });
    if (!partenaire) {
      throw new NotFoundException('Restaurant introuvable.');
    }
    if (!partenaire.statutOuverture) {
      throw new BadRequestException('Ce restaurant est actuellement fermé.');
    }

    const adresse = await this.prisma.adresse.findUnique({
      where: { id: dto.adresseId },
    });
    if (!adresse || adresse.userId !== clientId) {
      throw new NotFoundException('Adresse introuvable.');
    }

    const platIds = [...new Set(dto.lignes.map((ligne) => ligne.platId))];
    const plats = await this.prisma.plat.findMany({
      where: { id: { in: platIds } },
    });
    const platsById = new Map(plats.map((plat) => [plat.id, plat]));

    for (const platId of platIds) {
      const plat = platsById.get(platId);
      if (!plat || plat.partenaireId !== partenaire.id) {
        throw new BadRequestException(
          `Plat introuvable pour ce restaurant : ${platId}`,
        );
      }
      if (!plat.disponible) {
        throw new BadRequestException(`Plat indisponible : ${plat.nom}`);
      }
    }

    // Décomposition du prix décidée le 2026-08-25 (RG-08) : le restaurant est
    // reversé sur sousTotal plein tarif ; fraisLivraison et commission
    // reviennent à ChapExpress. La zone facturée est celle du restaurant, pas
    // celle de l'adresse du client — la frontière exacte entre zones n'est
    // pas encore définie (Q-28).
    const sousTotal = dto.lignes.reduce((total, ligne) => {
      const plat = platsById.get(ligne.platId)!;
      return total + Number(plat.prix) * ligne.quantite;
    }, 0);
    const fraisLivraison = Number(partenaire.zone.fraisLivraison);
    const commission = Math.round((sousTotal + fraisLivraison) * 0.15);
    const montantTotal = sousTotal + fraisLivraison + commission;

    const commandeRepas = await this.prisma.$transaction(async (tx) => {
      const commande = await tx.commande.create({
        data: {
          typeService: TypeService.repas,
          clientId,
          adresseId: dto.adresseId,
          sousTotal,
          fraisLivraison,
          commission,
          montantTotal,
        },
      });

      const created = await tx.commandeRepas.create({
        data: {
          commandeId: commande.id,
          partenaireId: partenaire.id,
          lignes: {
            create: dto.lignes.map((ligne) => ({
              platId: ligne.platId,
              quantite: ligne.quantite,
              prixUnitaire: platsById.get(ligne.platId)!.prix,
              instructions: ligne.instructions,
            })),
          },
        },
        include: DETAIL_INCLUDE,
      });

      await tx.paiement.create({
        data: {
          commandeId: commande.id,
          montant: montantTotal,
          mode: dto.modePaiement,
          statut:
            dto.modePaiement === 'especes'
              ? StatutPaiement.a_percevoir_livraison
              : StatutPaiement.en_attente,
        },
      });

      return created;
    });

    // F-RES-01 : alerte temps réel côté restaurant, remplace le polling sur
    // /restaurants/me/commandes.
    this.realtime.emitToUser(partenaire.userId, 'commande:nouvelle', {
      typeService: 'repas',
      commandeId: commandeRepas.id,
    });

    return commandeRepas;
  }

  async findOneForUser(userId: string, role: string, id: string) {
    const commandeRepas = await this.getDetail(id);
    await this.assertCanView(userId, role, commandeRepas);
    return commandeRepas;
  }

  findAllForClient(clientId: string) {
    return this.prisma.commandeRepas.findMany({
      where: { commande: { clientId } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForPartenaire(partenaireId: string) {
    return this.prisma.commandeRepas.findMany({
      where: { partenaireId },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pas d'attribution automatique par proximité/rotation à ce stade (RG-14,
  // algorithme non tranché — Q-15) : le livreur choisit lui-même une course
  // prête parmi celles de sa zone, non encore prises. Filtre par zone du
  // restaurant plutôt que par distance réelle, en cohérence avec la
  // simplification déjà faite sur les frais de livraison (Q-28).
  async findDisponiblesPourLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeRepas.findMany({
      where: {
        statut: StatutRepas.prete,
        commande: { livreurId: null },
        partenaire: { zoneId: livreur.zoneId },
      },
      include: DISPONIBLES_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeRepas.findMany({
      where: { commande: { livreurId: livreur.id } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Prise en charge atomique (V02) : l'assignation du livreur passe par un
  // updateMany conditionné sur livreurId: null ET statut prete ET zone du
  // partenaire == zone du livreur (V02b), comme pour Colis/Emplettes/Courses
  // express — deux livreurs ne peuvent plus se disputer la même course, et un
  // livreur ne peut plus prendre une course hors de sa zone en connaissant
  // simplement son id.
  async prendreEnCharge(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    if (!livreur.disponible) {
      throw new BadRequestException(
        'Passez votre statut à disponible avant de prendre une course.',
      );
    }

    const commandeRepas = await this.prisma.commandeRepas.findUnique({
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
    if (!commandeRepas) {
      throw new NotFoundException('Commande introuvable.');
    }

    // V09 / RG-02 : le cash Repas collecté à la livraison compte pour le
    // plafond de caisse du livreur, comme les autres services.
    if (commandeRepas.commande.paiement?.mode === 'especes') {
      await this.portefeuille.verifierPlafondCaisse(
        livreur.id,
        livreur.plafondCaisse,
        Number(commandeRepas.commande.montantTotal ?? 0),
      );
    }

    const { count } = await this.prisma.commande.updateMany({
      where: {
        id: commandeRepas.commandeId,
        livreurId: null,
        commandeRepas: {
          statut: StatutRepas.prete,
          partenaire: { zoneId: livreur.zoneId },
        },
      },
      data: { livreurId: livreur.id },
    });
    if (count === 0) {
      throw new ConflictException(
        'Cette course a déjà été prise en charge ou n’est plus disponible.',
      );
    }

    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.recuperee_par_livreur },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.recuperee_par_livreur,
      );
    }
    return updated;
  }

  async marquerEnRoute(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.recuperee_par_livreur);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.en_route },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.en_route,
      );
    }
    return updated;
  }

  async marquerLivree(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    const commandeRepas = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_route);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.commandeRepas.update({
        where: { id },
        data: { statut: StatutRepas.livree },
        include: DETAIL_INCLUDE,
      });
      if (commandeRepas.commande.paiement?.mode === 'especes') {
        await this.portefeuille.enregistrerEncaissement(
          tx,
          livreur.id,
          commandeRepas.commande.id,
          Number(commandeRepas.commande.montantTotal ?? 0),
        );
      }
      return result;
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.livree,
      );
    }
    return updated;
  }

  async accepter(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.confirmee },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.confirmee,
      );
    }
    return updated;
  }

  async refuser(userId: string, id: string, motif: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.refusee, motifRefus: motif },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.refusee,
      );
    }
    return updated;
  }

  async marquerEnPreparation(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.confirmee);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.en_preparation },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.en_preparation,
      );
    }
    return updated;
  }

  async marquerPrete(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_preparation);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.prete },
      include: DETAIL_INCLUDE,
    });
    if (commandeRepas.commande.clientId) {
      this.notifierClient(
        commandeRepas.commande.clientId,
        id,
        StatutRepas.prete,
      );
    }
    return updated;
  }

  async annuler(userId: string, id: string) {
    const commandeRepas = await this.getDetail(id);
    if (commandeRepas.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    const updated = await this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.annulee },
      include: DETAIL_INCLUDE,
    });
    // Notifie aussi le restaurant : la commande annulée disparaît de sa file.
    this.realtime.emitToUser(updated.partenaire.userId, 'commande:statut', {
      typeService: 'repas',
      commandeId: id,
      statut: StatutRepas.annulee,
    });
    return updated;
  }

  private async getDetail(id: string): Promise<CommandeRepasDetail> {
    const commandeRepas = await this.prisma.commandeRepas.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!commandeRepas) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commandeRepas;
  }

  private async getOwnedByRestaurant(userId: string, id: string) {
    const commandeRepas = await this.getDetail(id);
    if (commandeRepas.partenaire.userId !== userId) {
      throw new ForbiddenException(
        'Cette commande ne concerne pas votre restaurant.',
      );
    }
    return commandeRepas;
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
    const commandeRepas = await this.getDetail(id);
    if (commandeRepas.commande.livreurId !== livreur.id) {
      throw new ForbiddenException('Cette course ne vous a pas été attribuée.');
    }
    return commandeRepas;
  }

  private async assertCanView(
    userId: string,
    role: string,
    commandeRepas: CommandeRepasDetail,
  ) {
    const isClient = commandeRepas.commande.clientId === userId;
    const isRestaurant = commandeRepas.partenaire.userId === userId;
    const isAdmin = role === ADMIN_ROLE_NAME;
    let isLivreur = false;
    if (!isClient && !isRestaurant && !isAdmin && role === 'livreur') {
      const livreur = await this.prisma.livreur.findUnique({
        where: { userId },
      });
      isLivreur =
        livreur !== null && commandeRepas.commande.livreurId === livreur.id;
    }
    if (!isClient && !isRestaurant && !isAdmin && !isLivreur) {
      throw new ForbiddenException('Accès refusé à cette commande.');
    }
  }

  private assertStatut(
    commandeRepas: CommandeRepasDetail,
    expected: StatutRepas,
  ) {
    if (commandeRepas.statut !== expected) {
      throw new BadRequestException(
        `Transition impossible depuis le statut « ${commandeRepas.statut} ».`,
      );
    }
  }
}
