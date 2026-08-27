import {
  BadRequestException,
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
import { PrismaService } from '../prisma/prisma.service';
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

const ADMIN_ROLE_NAME = 'admin_dispatcher';

@Injectable()
export class CommandesRepasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateCommandeRepasDto) {
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
      include: DETAIL_INCLUDE,
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

  async prendreEnCharge(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    if (!livreur.disponible) {
      throw new BadRequestException(
        'Passez votre statut à disponible avant de prendre une course.',
      );
    }
    const commandeRepas = await this.getDetail(id);
    this.assertStatut(commandeRepas, StatutRepas.prete);
    if (commandeRepas.commande.livreurId) {
      throw new BadRequestException('Cette course a déjà été prise en charge.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.commande.update({
        where: { id: commandeRepas.commande.id },
        data: { livreurId: livreur.id },
      });
      return tx.commandeRepas.update({
        where: { id },
        data: { statut: StatutRepas.recuperee_par_livreur },
        include: DETAIL_INCLUDE,
      });
    });
  }

  async marquerEnRoute(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.recuperee_par_livreur);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.en_route },
      include: DETAIL_INCLUDE,
    });
  }

  async marquerLivree(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_route);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.livree },
      include: DETAIL_INCLUDE,
    });
  }

  async accepter(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.confirmee },
      include: DETAIL_INCLUDE,
    });
  }

  async refuser(userId: string, id: string, motif: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.refusee, motifRefus: motif },
      include: DETAIL_INCLUDE,
    });
  }

  async marquerEnPreparation(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.confirmee);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.en_preparation },
      include: DETAIL_INCLUDE,
    });
  }

  async marquerPrete(userId: string, id: string) {
    const commandeRepas = await this.getOwnedByRestaurant(userId, id);
    this.assertStatut(commandeRepas, StatutRepas.en_preparation);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.prete },
      include: DETAIL_INCLUDE,
    });
  }

  async annuler(userId: string, id: string) {
    const commandeRepas = await this.getDetail(id);
    if (commandeRepas.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commandeRepas, StatutRepas.en_attente_acceptation);
    return this.prisma.commandeRepas.update({
      where: { id },
      data: { statut: StatutRepas.annulee },
      include: DETAIL_INCLUDE,
    });
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
