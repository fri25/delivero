import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CibleNotation,
  Prisma,
  StatutColis,
  StatutCoursesExpress,
  StatutEmplettes,
  StatutRepas,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NoterCommandeDto } from './dto/noter-commande.dto';

// Service statuses after which the service was actually delivered.
const STATUTS_LIVRES: string[] = [
  StatutRepas.livree,
  StatutColis.livre,
  StatutCoursesExpress.terminee,
  StatutEmplettes.livree,
];

const COMMANDE_SELECT = {
  id: true,
  clientId: true,
  livreurId: true,
  commandeRepas: { select: { statut: true, partenaireId: true } },
  commandeColis: { select: { statut: true } },
  commandeCoursesExpress: { select: { statut: true } },
  commandeEmplettes: { select: { statut: true } },
} satisfies Prisma.CommandeSelect;

type CommandeANoter = Prisma.CommandeGetPayload<{
  select: typeof COMMANDE_SELECT;
}>;

/**
 * F-CLI-08: rating of the partner (Repas only — the other services have no
 * partner) and of the livreur, once the order is delivered. One rating per
 * target per order, final.
 */
@Injectable()
export class NotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async noterParClient(
    clientId: string,
    commandeId: string,
    dto: NoterCommandeDto,
  ) {
    const commande = await this.getCommande(commandeId);
    if (commande.clientId !== clientId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas.');
    }
    return this.noter(commande, dto);
  }

  /** Shared by the signed-in client and the guest tracking link. */
  async noter(commande: CommandeANoter, dto: NoterCommandeDto) {
    const statut =
      commande.commandeRepas?.statut ??
      commande.commandeColis?.statut ??
      commande.commandeCoursesExpress?.statut ??
      commande.commandeEmplettes?.statut;
    if (!statut || !STATUTS_LIVRES.includes(statut)) {
      throw new BadRequestException(
        'Vous pourrez noter une fois la commande livrée.',
      );
    }

    const cibles = dto.notes.map((n) => n.cible);
    if (new Set(cibles).size !== cibles.length) {
      throw new BadRequestException('Une seule note par cible.');
    }

    const donnees = dto.notes.map((n) => {
      if (n.cible === CibleNotation.partenaire) {
        const partenaireId = commande.commandeRepas?.partenaireId;
        if (!partenaireId) {
          throw new BadRequestException(
            'Cette commande n’a pas de partenaire à noter.',
          );
        }
        return { ...n, partenaireId, livreurId: null };
      }
      if (!commande.livreurId) {
        throw new BadRequestException(
          'Aucun livreur n’a assuré cette commande.',
        );
      }
      return { ...n, partenaireId: null, livreurId: commande.livreurId };
    });

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const d of donnees) {
          await tx.notation.create({
            data: {
              commandeId: commande.id,
              cible: d.cible,
              note: d.note,
              commentaire: d.commentaire?.trim() || null,
              partenaireId: d.partenaireId,
              livreurId: d.livreurId,
            },
          });
          await this.recalculerMoyenne(tx, d.partenaireId, d.livreurId);
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Vous avez déjà noté cette commande.');
      }
      throw error;
    }

    return this.prisma.notation.findMany({
      where: { commandeId: commande.id },
      select: { cible: true, note: true, commentaire: true },
    });
  }

  async getCommande(commandeId: string): Promise<CommandeANoter> {
    const commande = await this.prisma.commande.findUnique({
      where: { id: commandeId },
      select: COMMANDE_SELECT,
    });
    if (!commande) {
      throw new NotFoundException('Commande introuvable.');
    }
    return commande;
  }

  // Recomputed from all ratings rather than incrementally: cheap at this
  // volume and self-correcting.
  private async recalculerMoyenne(
    tx: Prisma.TransactionClient,
    partenaireId: string | null,
    livreurId: string | null,
  ) {
    if (partenaireId) {
      const { _avg } = await tx.notation.aggregate({
        where: { partenaireId },
        _avg: { note: true },
      });
      await tx.partenaire.update({
        where: { id: partenaireId },
        data: { noteMoyenne: arrondir(_avg.note) },
      });
    }
    if (livreurId) {
      const { _avg } = await tx.notation.aggregate({
        where: { livreurId },
        _avg: { note: true },
      });
      await tx.livreur.update({
        where: { id: livreurId },
        data: { noteMoyenne: arrondir(_avg.note) },
      });
    }
  }
}

function arrondir(moyenne: number | null): number | null {
  return moyenne === null ? null : Math.round(moyenne * 100) / 100;
}
