import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModeEmplettes,
  ModeFinancementEmplettes,
  ModePaiement,
  Prisma,
  StatutEmplettes,
  StatutPaiement,
  TypeService,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommandeEmplettesDto } from './dto/create-commande-emplettes.dto';
import { DeclarerLitigeEmplettesDto } from './dto/declarer-litige-emplettes.dto';
import { PointerArticleDto } from './dto/pointer-article.dto';
import { TerminerAchatsDto } from './dto/terminer-achats.dto';
import { ValiderDepassementDto } from './dto/valider-depassement.dto';

const DETAIL_INCLUDE = {
  commande: {
    include: {
      adresse: true,
      client: { select: { id: true, nom: true, telephone: true } },
      paiement: { select: { mode: true, statut: true } },
    },
  },
  articles: { orderBy: { createdAt: 'asc' } },
  zone: { select: { id: true, nom: true } },
} satisfies Prisma.CommandeEmplettesInclude;

type CommandeEmplettesDetail = Prisma.CommandeEmplettesGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

const ADMIN_ROLE_NAME = 'admin_dispatcher';

// Frais de service Emplettes : aucun pourcentage/forfait n'est arbitré (voir
// docs/service-emplettes.md "Flux financier"). Valeur PROVISOIRE, non validée
// par la direction — même statut que MAJORATION_TAILLE côté Colis.
const FRAIS_SERVICE_POURCENTAGE = 0.1;

@Injectable()
export class CommandesEmplettesService {
  constructor(private readonly prisma: PrismaService) {}

  async estimer(zoneId: string, budgetMax: number) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }
    const fraisLivraison = Number(zone.fraisLivraison);
    const fraisServiceEstime = Math.round(
      budgetMax * FRAIS_SERVICE_POURCENTAGE,
    );
    const totalEstime = budgetMax + fraisLivraison + fraisServiceEstime;
    return {
      zoneId,
      budgetMax,
      fraisLivraison,
      fraisServiceEstime,
      totalEstime,
    };
  }

  async create(clientId: string, dto: CreateCommandeEmplettesDto) {
    if (dto.mode !== ModeEmplettes.liste_libre) {
      throw new BadRequestException(
        'Le mode catalogue partenaire n’est pas encore disponible ; seul le mode liste libre est pris en charge.',
      );
    }

    const adresse = await this.prisma.adresse.findUnique({
      where: { id: dto.adresseId },
    });
    if (!adresse || adresse.userId !== clientId) {
      throw new NotFoundException('Adresse introuvable.');
    }

    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }

    // Estimation initiale, recalculée intégralement au réel lors du passage
    // en achats_termines (voir terminerAchats) : sousTotal reste null tant
    // que le montant réel des achats n'est pas connu.
    const fraisLivraison = Number(zone.fraisLivraison);
    const fraisServiceEstime = Math.round(
      dto.budgetMax * FRAIS_SERVICE_POURCENTAGE,
    );
    const montantTotalEstime =
      dto.budgetMax + fraisLivraison + fraisServiceEstime;

    const { mode: modePaiement, statut: statutPaiement } =
      this.paiementPourFinancement(dto.modeFinancement);

    const commandeEmplettes = await this.prisma.$transaction(async (tx) => {
      const commande = await tx.commande.create({
        data: {
          typeService: TypeService.emplettes,
          clientId,
          adresseId: dto.adresseId,
          fraisLivraison,
          commission: fraisServiceEstime,
          montantTotal: montantTotalEstime,
        },
      });

      // Le paiement doit être créé avant la lecture avec `include` ci-dessous
      // (voir le même correctif que commandes-colis.service.ts : sinon
      // `commande.paiement` revient `null` dans la réponse).
      await tx.paiement.create({
        data: {
          commandeId: commande.id,
          montant: montantTotalEstime,
          mode: modePaiement,
          statut: statutPaiement,
        },
      });

      return tx.commandeEmplettes.create({
        data: {
          commandeId: commande.id,
          mode: ModeEmplettes.liste_libre,
          lieuAchat: dto.lieuAchat,
          zoneId: dto.zoneId,
          budgetMax: dto.budgetMax,
          modeFinancement: dto.modeFinancement,
          articles: {
            create: dto.articles.map((article) => ({
              libelle: article.libelle,
              preferenceRemplacement: article.preferenceRemplacement,
            })),
          },
        },
        include: DETAIL_INCLUDE,
      });
    });

    return commandeEmplettes;
  }

  async findOneForUser(userId: string, role: string, id: string) {
    const commande = await this.getDetail(id);
    await this.assertCanView(userId, role, commande);
    return commande;
  }

  findAllForClient(clientId: string) {
    return this.prisma.commandeEmplettes.findMany({
      where: { commande: { clientId } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Pas d'attribution automatique à ce stade (RG-14, Q-15 non tranché),
  // même principe que Repas/Colis. Filtre par zone du livreur.
  async findDisponiblesPourLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeEmplettes.findMany({
      where: {
        statut: StatutEmplettes.confirmee,
        commande: { livreurId: null },
        zoneId: livreur.zoneId,
      },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllForLivreur(userId: string) {
    const livreur = await this.getLivreurByUserId(userId);
    return this.prisma.commandeEmplettes.findMany({
      where: { commande: { livreurId: livreur.id } },
      include: DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Prise en charge atomique, même garantie que Colis : deux prises en
  // charge concurrentes sur la même commande, une seule réussit. Contrairement
  // à Colis, il n'y a pas d'étape "en route pour l'enlèvement" : la machine à
  // états d'Emplettes passe directement confirmee -> achats_en_cours (voir
  // service-emplettes.md).
  async prendreEnCharge(userId: string, id: string) {
    const livreur = await this.getLivreurByUserId(userId);
    if (!livreur.disponible) {
      throw new BadRequestException(
        'Passez votre statut à disponible avant de prendre une commande.',
      );
    }

    const commandeEmplettes = await this.prisma.commandeEmplettes.findUnique({
      where: { id },
      select: { commandeId: true },
    });
    if (!commandeEmplettes) {
      throw new NotFoundException('Commande introuvable.');
    }

    const { count } = await this.prisma.commande.updateMany({
      where: {
        id: commandeEmplettes.commandeId,
        livreurId: null,
        commandeEmplettes: { statut: StatutEmplettes.confirmee },
      },
      data: { livreurId: livreur.id },
    });
    if (count === 0) {
      throw new ConflictException(
        'Cette commande a déjà été prise en charge ou n’est plus disponible.',
      );
    }

    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: { statut: StatutEmplettes.achats_en_cours },
      include: DETAIL_INCLUDE,
    });
  }

  async pointerArticle(
    userId: string,
    id: string,
    articleId: string,
    dto: PointerArticleDto,
  ) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutEmplettes.achats_en_cours);

    const article = commande.articles.find((a) => a.id === articleId);
    if (!article) {
      throw new NotFoundException('Article introuvable pour cette commande.');
    }

    if (
      (dto.statut === 'achete' || dto.statut === 'remplace') &&
      dto.prixReel === undefined
    ) {
      throw new BadRequestException(
        'Le prix réel est obligatoire pour cet article.',
      );
    }
    if (dto.statut === 'remplace' && !dto.produitRemplacementLibelle) {
      throw new BadRequestException(
        'Précisez le produit de remplacement pour cet article.',
      );
    }

    await this.prisma.articleEmplette.update({
      where: { id: articleId },
      data: {
        statut: dto.statut,
        prixReel: dto.statut === 'indisponible' ? null : dto.prixReel,
        produitRemplacementLibelle:
          dto.statut === 'remplace' ? dto.produitRemplacementLibelle : null,
      },
    });

    const articlesAJour = await this.prisma.articleEmplette.findMany({
      where: { commandeEmplettesId: commande.id },
    });
    const montantReel = articlesAJour
      .filter((a) => a.statut === 'achete' || a.statut === 'remplace')
      .reduce((total, a) => total + Number(a.prixReel ?? 0), 0);

    // Ne bloquer que sur un NOUVEAU franchissement du budget : une fois le
    // client passé par validerDepassement (achats_en_cours restauré), les
    // pointages suivants ne doivent pas re-déclencher le blocage tant que le
    // montant réel ne fait que rester au-dessus d'un budget déjà dépassé
    // (ex. marquer un article "indisponible" derrière, qui n'ajoute rien).
    // Sans ce garde-fou, la commande resterait bloquée indéfiniment après la
    // première validation dès que budgetMax est dépassé.
    const budgetMax = Number(commande.budgetMax);
    const etaitDejaEnDepassement =
      Number(commande.montantReel ?? 0) > budgetMax;
    const nouveauDepassement =
      montantReel > budgetMax && !etaitDejaEnDepassement;

    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: {
        montantReel,
        statut: nouveauDepassement
          ? StatutEmplettes.validation_depassement
          : undefined,
      },
      include: DETAIL_INCLUDE,
    });
  }

  // RG-05 / Q-12 (décidé sur le principe) : blocage par défaut, le client
  // doit valider explicitement. Le délai d'attente maximum et l'escalade
  // automatique après expiration (Q-26) ne sont pas arbitrés fermement et
  // nécessiteraient une tâche planifiée absente de ce projet — non
  // implémentés ici.
  async validerDepassement(
    userId: string,
    id: string,
    dto: ValiderDepassementDto,
  ) {
    const commande = await this.getDetail(id);
    if (commande.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commande, StatutEmplettes.validation_depassement);

    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: {
        statut: dto.accepter
          ? StatutEmplettes.achats_en_cours
          : StatutEmplettes.annulee,
      },
      include: DETAIL_INCLUDE,
    });
  }

  async terminerAchats(userId: string, id: string, dto: TerminerAchatsDto) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutEmplettes.achats_en_cours);

    const articleNonPointe = commande.articles.some(
      (a) => a.statut === 'en_attente',
    );
    if (articleNonPointe) {
      throw new BadRequestException('Il reste des articles non pointés.');
    }

    // Décompte final transparent (RG-08) : sousTotal/commission/montantTotal
    // passent de l'estimation posée à la création au réel constaté pendant
    // les achats.
    const sousTotal = Number(commande.montantReel ?? 0);
    const fraisLivraison = Number(commande.commande.fraisLivraison ?? 0);
    const commission = Math.round(sousTotal * FRAIS_SERVICE_POURCENTAGE);
    const montantTotal = sousTotal + fraisLivraison + commission;

    return this.prisma.$transaction(async (tx) => {
      await tx.commande.update({
        where: { id: commande.commande.id },
        data: { sousTotal, commission, montantTotal },
      });
      return tx.commandeEmplettes.update({
        where: { id },
        data: {
          statut: StatutEmplettes.achats_termines,
          recapitulatifAchats: dto.recapitulatifAchats,
        },
        include: DETAIL_INCLUDE,
      });
    });
  }

  async marquerEnRoute(userId: string, id: string) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutEmplettes.achats_termines);
    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: { statut: StatutEmplettes.en_route },
      include: DETAIL_INCLUDE,
    });
  }

  async marquerLivree(userId: string, id: string) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutEmplettes.en_route);
    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: { statut: StatutEmplettes.livree },
      include: DETAIL_INCLUDE,
    });
  }

  // Litige atteignable dans cette itération, déclaré par le livreur, sans
  // validation dispatcher (aucun back-office) — même principe que Colis.
  // Reachable uniquement depuis achats_en_cours, seule transition présente
  // dans la machine à états de docs/service-emplettes.md.
  async declarerLitige(
    userId: string,
    id: string,
    dto: DeclarerLitigeEmplettesDto,
  ) {
    const commande = await this.getOwnedByLivreur(userId, id);
    this.assertStatut(commande, StatutEmplettes.achats_en_cours);
    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: { statut: StatutEmplettes.litige, motif: dto.motif },
      include: DETAIL_INCLUDE,
    });
  }

  // Annulation possible uniquement avant le début des achats (confirmee),
  // conforme à la machine à états de docs/service-emplettes.md.
  async annuler(userId: string, id: string) {
    const commande = await this.getDetail(id);
    if (commande.commande.clientId !== userId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    this.assertStatut(commande, StatutEmplettes.confirmee);
    return this.prisma.commandeEmplettes.update({
      where: { id },
      data: { statut: StatutEmplettes.annulee },
      include: DETAIL_INCLUDE,
    });
  }

  private paiementPourFinancement(modeFinancement: ModeFinancementEmplettes): {
    mode: ModePaiement;
    statut: StatutPaiement;
  } {
    if (modeFinancement === ModeFinancementEmplettes.mobile_money_anticipe) {
      return {
        mode: ModePaiement.mobile_money,
        statut: StatutPaiement.en_attente,
      };
    }
    // especes_livraison et avance_livreur sont tous deux réglés en espèces à
    // la livraison du point de vue du paiement enregistré ici ; seule la
    // provenance de l'avance diffère (client vs livreur), non tracée par ce
    // module (portefeuille livreur consolidé hors périmètre, voir F-LIV-09).
    return {
      mode: ModePaiement.especes,
      statut: StatutPaiement.a_percevoir_livraison,
    };
  }

  private async getDetail(id: string): Promise<CommandeEmplettesDetail> {
    const commande = await this.prisma.commandeEmplettes.findUnique({
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
    commande: CommandeEmplettesDetail,
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
    commande: CommandeEmplettesDetail,
    expected: StatutEmplettes,
  ) {
    if (commande.statut !== expected) {
      throw new ConflictException(
        `Transition impossible depuis le statut « ${commande.statut} ».`,
      );
    }
  }
}
