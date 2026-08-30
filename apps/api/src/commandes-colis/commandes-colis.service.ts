import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  Prisma,
  StatutColis,
  StatutPaiement,
  TailleColis,
  TypeService,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateCommandeColisDto } from './dto/create-commande-colis.dto';
import { DeclarerLitigeColisDto } from './dto/declarer-litige-colis.dto';
import { LivrerColisDto } from './dto/livrer-colis.dto';

const DETAIL_INCLUDE = {
  commande: {
    include: {
      adresse: true,
      client: { select: { id: true, nom: true, telephone: true } },
      paiement: { select: { mode: true, statut: true } },
    },
  },
  adresseEnlevement: true,
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeColisInclude;

type CommandeColisDetail = Prisma.CommandeColisGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

// Le code de remise (codeOtp) ne doit jamais atteindre un écran livreur : sa
// valeur sert justement à vérifier, à la livraison, que la bonne personne l'a
// obtenue de l'expéditeur. Appliqué à toutes les requêtes/réponses côté
// livreur ci-dessous.
const LIVREUR_OMIT = { codeOtp: true } satisfies Prisma.CommandeColisOmit;

// V11 : avant acceptation, ni le contact de l'expéditeur (commande.client) ni
// celui du destinataire (destinataireNom/destinataireTelephone) ne doivent
// être visibles — seules les adresses restent nécessaires pour juger de la
// faisabilité. Redevient visible une fois le colis pris (voir DETAIL_INCLUDE
// + LIVREUR_OMIT, utilisés par getOwnedByLivreur).
const DISPONIBLES_INCLUDE = {
  commande: {
    include: {
      adresse: true,
      paiement: { select: { mode: true, statut: true } },
    },
  },
  adresseEnlevement: true,
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeColisInclude;
const DISPONIBLES_OMIT = {
  codeOtp: true,
  destinataireNom: true,
  destinataireTelephone: true,
} satisfies Prisma.CommandeColisOmit;

// Champs sûrs à exposer publiquement au destinataire (RG-07, suivi par lien
// public sans compte) : jamais le téléphone/l'adresse du client, jamais le
// code OTP. Liste blanche volontaire — un futur champ ajouté sur
// CommandeColis ne doit pas fuiter par défaut.
const SUIVI_PUBLIC_SELECT = {
  id: true,
  statut: true,
  taille: true,
  fragile: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CommandeColisSelect;

const ADMIN_ROLE_NAME = 'admin_dispatcher';

// Majoration provisoire par taille, appliquée au tarif de base par zone
// (GrilleTarifaireColis.tarifBase, lui-même provisoire — voir schema.prisma).
// Vit en code, pas en base : seule la composante par zone doit être
// ajustable sans déploiement pour l'instant. Non validé par la direction.
const MAJORATION_TAILLE: Record<TailleColis, number> = {
  petit: 1,
  moyen: 1.5,
  grand: 2,
};

@Injectable()
export class CommandesColisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // F-CLI-05 : voir même principe que commandes-repas.service.ts.
  private notifierClient(clientId: string, commandeId: string, statut: string) {
    this.realtime.emitToUser(clientId, 'commande:statut', {
      typeService: 'colis',
      commandeId,
      statut,
    });
  }

  async estimer(zoneId: string, taille: TailleColis) {
    const tarif = await this.calculerTarif(zoneId, taille);
    return { zoneId, taille, tarif };
  }

  async create(clientId: string, dto: CreateCommandeColisDto) {
    const adresse = await this.prisma.adresse.findUnique({
      where: { id: dto.adresseEnlevementId },
    });
    if (!adresse || adresse.userId !== clientId) {
      throw new NotFoundException('Adresse d’enlèvement introuvable.');
    }

    if (dto.programmationAt) {
      const programmationAt = new Date(dto.programmationAt);
      if (programmationAt.getTime() <= Date.now()) {
        throw new BadRequestException(
          'Le créneau planifié doit être dans le futur.',
        );
      }
    }

    // Le tarif est toujours recalculé côté serveur : aucun montant envoyé par
    // le client n'est pris en compte.
    const tarif = await this.calculerTarif(dto.zoneId, dto.taille);
    const codeOtp = generateCodeOtp();

    const commandeColis = await this.prisma.$transaction(async (tx) => {
      const commande = await tx.commande.create({
        data: {
          typeService: TypeService.colis,
          clientId,
          montantTotal: tarif,
        },
      });

      // Le paiement doit être créé avant la lecture avec `include` ci-dessous
      // : sinon `commande.paiement` revient `null` dans la réponse (la ligne
      // Paiement n'existe pas encore au moment où Prisma résout l'include),
      // même si elle est bien committée en base à la fin de la transaction.
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

      return tx.commandeColis.create({
        data: {
          commandeId: commande.id,
          adresseEnlevementId: dto.adresseEnlevementId,
          zoneId: dto.zoneId,
          taille: dto.taille,
          destinataireNom: dto.destinataireNom,
          destinataireTelephone: dto.destinataireTelephone,
          adresseLivraison: dto.adresseLivraison,
          pointDeRepereLivraison: dto.pointDeRepereLivraison,
          latitudeLivraison: dto.latitudeLivraison,
          longitudeLivraison: dto.longitudeLivraison,
          valeurDeclaree: dto.valeurDeclaree,
          fragile: dto.fragile ?? false,
          montantContreRemboursement: dto.montantContreRemboursement,
          conditionsAcceptees: dto.conditionsAcceptees,
          programmationAt: dto.programmationAt
            ? new Date(dto.programmationAt)
            : null,
          codeOtp,
        },
        include: DETAIL_INCLUDE,
      });
    });

    return commandeColis;
  }

  async findOneForUser(userId: string, role: string, id: string) {
    const commandeColis = await this.getDetail(id);
    await this.assertCanView(userId, role, commandeColis);
    if (commandeColis.commande.clientId === userId) {
      return commandeColis;
    }
    // Vue livreur/admin : refait la requête avec omit plutôt que de retirer
    // le champ à la main, pour rester cohérent avec les autres méthodes
    // livreur ci-dessous.
    return this.prisma.commandeColis.findUniqueOrThrow({
      where: { id },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
    });
  }

  findAllForClient(clientId: string) {
    return this.prisma.commandeColis.findMany({
      where: { commande: { clientId } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pas d'attribution automatique par proximité/rotation à ce stade (RG-14,
  // algorithme non tranché — Q-15), comme pour Repas : le livreur choisit
  // lui-même un colis prêt dans sa zone, non encore pris. Un colis planifié
  // pour plus tard n'apparaît pas avant son créneau.
  async findDisponiblesPourLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeColis.findMany({
      where: {
        statut: StatutColis.confirmee,
        commande: { livreurId: null },
        zoneId: livreur.zoneId,
        OR: [
          { programmationAt: null },
          { programmationAt: { lte: new Date() } },
        ],
      },
      include: DISPONIBLES_INCLUDE,
      omit: DISPONIBLES_OMIT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeColis.findMany({
      where: { commande: { livreurId: livreur.id } },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Prise en charge atomique : l'assignation du livreur (updateMany conditionné
  // sur livreurId: null ET statut confirmee ET zone via la relation) empêche
  // deux livreurs de prendre le même colis simultanément et empêche une prise
  // hors zone (V02b) même si le livreur connaît l'id d'un colis qui n'est pas
  // dans sa zone. Si zéro ligne affectée, 409 sans chercher à distinguer la
  // cause exacte (déjà pris / mauvais statut / mauvaise zone) — l'appelant
  // doit simplement rafraîchir la liste des disponibles.
  async prendreEnCharge(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    if (!livreur.disponible) {
      throw new BadRequestException(
        'Passez votre statut à disponible avant de prendre une course.',
      );
    }

    // `id` est l'id de CommandeColis (celui de l'URL), pas celui de Commande
    // que porte livreurId : il faut résoudre commandeId avant l'updateMany
    // atomique, sans quoi le filtre `Commande.id` ne matcherait jamais rien.
    const commandeColis = await this.prisma.commandeColis.findUnique({
      where: { id },
      select: {
        commandeId: true,
        montantContreRemboursement: true,
        commande: {
          select: {
            clientId: true,
            montantTotal: true,
            paiement: { select: { mode: true } },
          },
        },
      },
    });
    if (!commandeColis) {
      throw new NotFoundException('Commande introuvable.');
    }

    // V09 / RG-02 / RG-04 : le livreur va potentiellement encaisser le tarif
    // (si payé en espèces) et/ou le contre-remboursement — les deux comptent
    // pour son plafond de caisse.
    const encaissementPotentiel =
      (commandeColis.commande.paiement?.mode === 'especes'
        ? Number(commandeColis.commande.montantTotal ?? 0)
        : 0) + Number(commandeColis.montantContreRemboursement ?? 0);
    if (encaissementPotentiel > 0) {
      await this.portefeuille.verifierPlafondCaisse(
        livreur.id,
        livreur.plafondCaisse,
        encaissementPotentiel,
      );
    }

    const { count } = await this.prisma.commande.updateMany({
      where: {
        id: commandeColis.commandeId,
        livreurId: null,
        commandeColis: {
          statut: StatutColis.confirmee,
          zoneId: livreur.zoneId,
        },
      },
      data: { livreurId: livreur.id },
    });
    if (count === 0) {
      throw new ConflictException(
        'Ce colis a déjà été pris en charge ou n’est plus disponible.',
      );
    }

    const updated = await this.prisma.commandeColis.update({
      where: { id },
      data: { statut: StatutColis.livreur_en_route_enlevement },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
    });
    if (commandeColis.commande.clientId) {
      this.notifierClient(
        commandeColis.commande.clientId,
        id,
        StatutColis.livreur_en_route_enlevement,
      );
    }
    return updated;
  }

  // Contrôle visuel à l'enlèvement, sans photo (aucun stockage de fichiers
  // S3 intégré à ce stade — voir CLAUDE.md [À FAIRE]).
  async marquerRecupere(userId: string, id: string) {
    const commandeColis = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeColis, StatutColis.livreur_en_route_enlevement);
    const updated = await this.prisma.commandeColis.update({
      where: { id },
      data: { statut: StatutColis.colis_recupere },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
    });
    if (commandeColis.commande.clientId) {
      this.notifierClient(
        commandeColis.commande.clientId,
        id,
        StatutColis.colis_recupere,
      );
    }
    return updated;
  }

  async marquerEnRoute(userId: string, id: string) {
    const commandeColis = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeColis, StatutColis.colis_recupere);
    const updated = await this.prisma.commandeColis.update({
      where: { id },
      data: { statut: StatutColis.en_route },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
    });
    if (commandeColis.commande.clientId) {
      this.notifierClient(
        commandeColis.commande.clientId,
        id,
        StatutColis.en_route,
      );
    }
    return updated;
  }

  async livrer(userId: string, id: string, dto: LivrerColisDto) {
    const livreur = await this.getLivreurByUserId(userId);
    const commandeColis = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commandeColis, StatutColis.en_route);

    if (dto.codeOtp !== commandeColis.codeOtp) {
      throw new BadRequestException('Code de remise incorrect.');
    }
    if (commandeColis.montantContreRemboursement && !dto.montantEncaisse) {
      throw new BadRequestException(
        'Le montant encaissé est obligatoire pour un colis en contre-remboursement.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.commandeColis.update({
        where: { id },
        data: {
          statut: StatutColis.livre,
          nomReceptionnaire: dto.nomReceptionnaire,
          montantEncaisse: dto.montantEncaisse,
        },
        include: DETAIL_INCLUDE,
        omit: LIVREUR_OMIT,
      });
      // RG-02/RG-04 : tarif espèces + contre-remboursement encaissés au même
      // moment (voir prendreEnCharge pour le contrôle de plafond en amont).
      const encaisse =
        (commandeColis.commande.paiement?.mode === 'especes'
          ? Number(commandeColis.commande.montantTotal ?? 0)
          : 0) + Number(dto.montantEncaisse ?? 0);
      await this.portefeuille.enregistrerEncaissement(
        tx,
        livreur.id,
        commandeColis.commande.id,
        encaisse,
      );
      return result;
    });
    if (commandeColis.commande.clientId) {
      this.notifierClient(
        commandeColis.commande.clientId,
        id,
        StatutColis.livre,
      );
    }
    return updated;
  }

  // Litige atteignable dans cette itération : déclaré par le livreur, sans
  // validation ni traitement par un dispatcher (aucun back-office, RG-12) —
  // décision documentée dans docs/service-colis.md.
  async declarerLitige(
    userId: string,
    id: string,
    dto: DeclarerLitigeColisDto,
  ) {
    const commandeColis = await this.getOwnedByLivreur(userId, id);
    if (
      commandeColis.statut !== StatutColis.colis_recupere &&
      commandeColis.statut !== StatutColis.en_route
    ) {
      throw new ConflictException(
        `Transition impossible depuis le statut « ${commandeColis.statut} ».`,
      );
    }
    const updated = await this.prisma.commandeColis.update({
      where: { id },
      data: { statut: StatutColis.litige, motif: dto.motif },
      include: DETAIL_INCLUDE,
      omit: LIVREUR_OMIT,
    });
    if (commandeColis.commande.clientId) {
      this.notifierClient(
        commandeColis.commande.clientId,
        id,
        StatutColis.litige,
      );
    }
    return updated;
  }

  // Annulation possible uniquement avant l'enlèvement (depuis confirmee),
  // conforme à la machine à états de docs/service-colis.md.
  async annuler(userId: string, id: string) {
    const commandeColis = await this.getDetail(id);
    if (commandeColis.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commandeColis, StatutColis.confirmee);
    return this.prisma.commandeColis.update({
      where: { id },
      data: { statut: StatutColis.annulee },
      include: DETAIL_INCLUDE,
    });
  }

  async suiviPublic(id: string) {
    const commandeColis = await this.prisma.commandeColis.findUnique({
      where: { id },
      select: SUIVI_PUBLIC_SELECT,
    });
    if (!commandeColis) {
      throw new NotFoundException('Colis introuvable.');
    }
    return commandeColis;
  }

  private async calculerTarif(zoneId: string, taille: TailleColis) {
    const grille = await this.prisma.grilleTarifaireColis.findUnique({
      where: { zoneId },
    });
    if (!grille) {
      throw new NotFoundException(
        'Aucune grille tarifaire Colis pour cette zone.',
      );
    }
    return Math.round(Number(grille.tarifBase) * MAJORATION_TAILLE[taille]);
  }

  private async getDetail(id: string): Promise<CommandeColisDetail> {
    const commandeColis = await this.prisma.commandeColis.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!commandeColis) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commandeColis;
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
    const commandeColis = await this.getDetail(id);
    if (commandeColis.commande.livreurId !== livreur.id) {
      throw new ForbiddenException('Ce colis ne vous a pas été attribué.');
    }
    return commandeColis;
  }

  private async assertCanView(
    userId: string,
    role: string,
    commandeColis: CommandeColisDetail,
  ) {
    const isClient = commandeColis.commande.clientId === userId;
    const isAdmin = role === ADMIN_ROLE_NAME;
    let isLivreur = false;
    if (!isClient && !isAdmin && role === 'livreur') {
      const livreur = await this.prisma.livreur.findUnique({
        where: { userId },
      });
      isLivreur =
        livreur !== null && commandeColis.commande.livreurId === livreur.id;
    }
    if (!isClient && !isAdmin && !isLivreur) {
      throw new ForbiddenException('Accès refusé à cette commande.');
    }
  }

  private assertStatut(
    commandeColis: CommandeColisDetail,
    expected: StatutColis,
  ) {
    if (commandeColis.statut !== expected) {
      throw new ConflictException(
        `Transition impossible depuis le statut « ${commandeColis.statut} ».`,
      );
    }
  }
}

// Code de remise à 6 chiffres, communiqué au destinataire par le client
// lui-même (voir commentaire codeOtp dans schema.prisma). V08 : généré par
// crypto.randomInt (CSPRNG) plutôt que Math.random — depuis V01, ce code est
// la seule preuve de remise acceptée, il ne doit plus être devinable.
function generateCodeOtp(): string {
  return randomInt(100000, 1000000).toString();
}
