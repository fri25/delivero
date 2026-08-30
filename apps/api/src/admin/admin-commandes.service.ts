import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Livreur,
  Prisma,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutRepas,
  TypeService,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { AttribuerCommandeDto } from './dto/attribuer-commande.dto';
import { ListCommandesDto } from './dto/list-commandes.dto';

// F-ADM-01 : vue d'ensemble des demandes, tous services. Pas de statut
// agrégé unique côté Commande (voir schema.prisma, commentaire sur le
// modèle Commande) : chaque spécialisation garde sa propre machine à
// états, on sélectionne juste celle qui correspond à typeService.
const OVERVIEW_SELECT = {
  id: true,
  typeService: true,
  createdAt: true,
  montantTotal: true,
  livreurId: true,
  client: { select: { nom: true, telephone: true } },
  livreur: { select: { user: { select: { nom: true, telephone: true } } } },
  commandeRepas: { select: { statut: true } },
  commandeColis: { select: { statut: true } },
  commandeEmplettes: { select: { statut: true } },
  commandeCoursesExpress: { select: { statut: true } },
} satisfies Prisma.CommandeSelect;

type OverviewRow = Prisma.CommandeGetPayload<{
  select: typeof OVERVIEW_SELECT;
}>;

export interface AdminCommandeRow {
  id: string;
  typeService: TypeService;
  statut: string | null;
  createdAt: Date;
  montantTotal: string | null;
  livreurId: string | null;
  client: { nom: string; telephone: string } | null;
  livreur: { nom: string; telephone: string } | null;
}

// Détail nécessaire à l'attribution (F-ADM-02/03) : zone, statut brut et
// montants pertinents pour les plafonds (RG-02), par service.
const ATTRIBUTION_SELECT = {
  id: true,
  typeService: true,
  livreurId: true,
  montantTotal: true,
  paiement: { select: { mode: true } },
  commandeRepas: {
    select: { statut: true, partenaire: { select: { zoneId: true } } },
  },
  commandeColis: {
    select: { statut: true, zoneId: true, montantContreRemboursement: true },
  },
  commandeEmplettes: {
    select: {
      statut: true,
      zoneId: true,
      modeFinancement: true,
      budgetMax: true,
    },
  },
  commandeCoursesExpress: { select: { statut: true, zoneId: true } },
} satisfies Prisma.CommandeSelect;

type AttributionCommande = Prisma.CommandeGetPayload<{
  select: typeof ATTRIBUTION_SELECT;
}>;

const STATUTS_TERMINAUX: Record<TypeService, string[]> = {
  repas: [StatutRepas.livree, StatutRepas.annulee, StatutRepas.refusee],
  colis: [StatutColis.livre, StatutColis.annulee, StatutColis.litige],
  emplettes: [
    StatutEmplettes.livree,
    StatutEmplettes.annulee,
    StatutEmplettes.litige,
  ],
  courses_express: [
    StatutCoursesExpress.terminee,
    StatutCoursesExpress.annulee,
    StatutCoursesExpress.litige,
  ],
};

@Injectable()
export class AdminCommandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
  ) {}

  async findAll(dto: ListCommandesDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const where: Prisma.CommandeWhereInput = dto.typeService
      ? { typeService: dto.typeService }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.commande.findMany({
        where,
        select: OVERVIEW_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.commande.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toRow(row)),
      total,
      page,
      pageSize,
    };
  }

  // F-ADM-02 (livreurId omis, rotation automatique) / F-ADM-03 (livreurId
  // fourni, réattribution manuelle) — RG-14.
  async attribuer(id: string, dto: AttribuerCommandeDto) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      select: ATTRIBUTION_SELECT,
    });
    if (!commande) {
      throw new NotFoundException('Commande introuvable.');
    }

    const statut = this.statutBrut(commande);
    if (statut && STATUTS_TERMINAUX[commande.typeService].includes(statut)) {
      throw new BadRequestException(
        `Impossible de (ré)attribuer une commande au statut « ${statut} ».`,
      );
    }

    const livreur = dto.livreurId
      ? await this.getLivreurOrThrow(dto.livreurId)
      : await this.choisirParRotation(commande);

    await this.prisma.commande.update({
      where: { id },
      data: { livreurId: livreur.id },
    });

    return this.prisma.commande
      .findUniqueOrThrow({
        where: { id },
        select: OVERVIEW_SELECT,
      })
      .then((row) => this.toRow(row));
  }

  private async getLivreurOrThrow(livreurId: string): Promise<Livreur> {
    const livreur = await this.prisma.livreur.findUnique({
      where: { id: livreurId },
    });
    if (!livreur) {
      throw new NotFoundException('Livreur introuvable.');
    }
    return livreur;
  }

  // Rotation : parmi les livreurs disponibles de la zone, celui dont la
  // dernière commande attribuée est la plus ancienne (jamais assigné =
  // priorité maximale). Filtré ensuite par les plafonds (RG-02) — le
  // premier livreur éligible dans l'ordre de rotation est retenu.
  // [DÉDUIT] : RG-14 laisse le choix entre "le plus proche" et "par
  // rotation" sans trancher le départage ; la proximité réelle suppose une
  // intégration cartographique absente (CLAUDE.md [À FAIRE]), la rotation
  // est donc le seul critère implémentable sans inventer une donnée GPS.
  private async choisirParRotation(
    commande: AttributionCommande,
  ): Promise<Livreur> {
    const zoneId = this.resolveZoneId(commande);
    const eligibles = await this.prisma.livreur.findMany({
      where: { zoneId, disponible: true },
    });
    if (eligibles.length === 0) {
      throw new BadRequestException(
        'Aucun livreur disponible dans cette zone.',
      );
    }

    const dernieresAssignations = await this.prisma.commande.groupBy({
      by: ['livreurId'],
      where: { livreurId: { in: eligibles.map((l) => l.id) } },
      _max: { createdAt: true },
    });
    const derniereParLivreur = new Map(
      dernieresAssignations
        .filter(
          (d): d is typeof d & { livreurId: string } => d.livreurId !== null,
        )
        .map((d) => [d.livreurId, d._max.createdAt?.getTime() ?? 0]),
    );

    const ordreRotation = [...eligibles].sort(
      (a, b) =>
        (derniereParLivreur.get(a.id) ?? 0) -
        (derniereParLivreur.get(b.id) ?? 0),
    );

    const { avance, caisse } = this.montantsPourPlafond(commande);
    for (const livreur of ordreRotation) {
      try {
        if (avance > 0) {
          await this.portefeuille.verifierPlafondAvance(
            livreur.id,
            livreur.plafondAvance,
            avance,
          );
        }
        if (caisse > 0) {
          await this.portefeuille.verifierPlafondCaisse(
            livreur.id,
            livreur.plafondCaisse,
            caisse,
          );
        }
        return livreur;
      } catch {
        continue;
      }
    }
    throw new BadRequestException(
      'Aucun livreur disponible ne respecte les plafonds pour cette commande.',
    );
  }

  private resolveZoneId(commande: AttributionCommande): string {
    switch (commande.typeService) {
      case TypeService.repas:
        return commande.commandeRepas!.partenaire.zoneId;
      case TypeService.colis:
        return commande.commandeColis!.zoneId;
      case TypeService.emplettes:
        return commande.commandeEmplettes!.zoneId;
      case TypeService.courses_express:
        return commande.commandeCoursesExpress!.zoneId;
    }
  }

  private statutBrut(commande: AttributionCommande): string | null {
    return (
      commande.commandeRepas?.statut ??
      commande.commandeColis?.statut ??
      commande.commandeEmplettes?.statut ??
      commande.commandeCoursesExpress?.statut ??
      null
    );
  }

  // Même logique que verifierPlafondCaisse/Avance dans les 4 services (voir
  // commandes-emplettes.service.ts, prendreEnCharge) — dupliquée ici plutôt
  // que factorisée, pour ne pas complexifier ces services avec un chemin
  // d'attribution qui leur est étranger.
  private montantsPourPlafond(commande: AttributionCommande): {
    avance: number;
    caisse: number;
  } {
    const especes = commande.paiement?.mode === 'especes';
    const montantTotal = Number(commande.montantTotal ?? 0);

    if (commande.typeService === TypeService.emplettes) {
      const emplettes = commande.commandeEmplettes!;
      const avance =
        emplettes.modeFinancement === 'avance_livreur'
          ? Number(emplettes.budgetMax)
          : 0;
      const caisse =
        emplettes.modeFinancement !== 'mobile_money_anticipe'
          ? montantTotal
          : 0;
      return { avance, caisse };
    }

    if (commande.typeService === TypeService.colis) {
      const caisse =
        (especes ? montantTotal : 0) +
        Number(commande.commandeColis!.montantContreRemboursement ?? 0);
      return { avance: 0, caisse };
    }

    return { avance: 0, caisse: especes ? montantTotal : 0 };
  }

  private toRow(row: OverviewRow): AdminCommandeRow {
    const statut =
      row.commandeRepas?.statut ??
      row.commandeColis?.statut ??
      row.commandeEmplettes?.statut ??
      row.commandeCoursesExpress?.statut ??
      null;

    return {
      id: row.id,
      typeService: row.typeService,
      statut,
      createdAt: row.createdAt,
      montantTotal: row.montantTotal?.toString() ?? null,
      livreurId: row.livreurId,
      client: row.client,
      livreur: row.livreur?.user ?? null,
    };
  }
}
