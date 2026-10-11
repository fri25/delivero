import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatutColis, StatutCoursesExpress, StatutRepas, TypeService } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvisDto } from './dto/create-avis.dto';

const COMMANDE_INCLUDE = {
  commandeRepas: { select: { statut: true, partenaireId: true, partenaire: { select: { nom: true } } } },
  commandeColis: { select: { statut: true } },
  commandeCoursesExpress: { select: { statut: true } },
  livreur: { include: { user: { select: { nom: true } } } },
  avisPartenaire: { include: { partenaire: { select: { nom: true } } } },
  avisLivreur: { include: { livreur: { include: { user: { select: { nom: true } } } } } },
} satisfies Prisma.CommandeInclude;

@Injectable()
export class AvisService {
  constructor(private readonly prisma: PrismaService) {}

  async findForClient(clientId: string, commandeId: string) {
    const commande = await this.getOwnedOrder(clientId, commandeId);
    const terminee = this.isCompleted(commande);
    const partenaireId = commande.commandeRepas?.partenaireId ?? null;
    const livreurId = commande.livreurId;

    return {
      partenaire: partenaireId
        ? {
            cibleId: partenaireId,
            nom: commande.commandeRepas?.partenaire.nom ?? 'Restaurant',
            autorise: terminee,
            avis: commande.avisPartenaire
              ? {
                  note: commande.avisPartenaire.note,
                  commentaire: commande.avisPartenaire.commentaire,
                  createdAt: commande.avisPartenaire.createdAt,
                }
              : null,
          }
        : null,
      livreur: livreurId
        ? {
            cibleId: livreurId,
            nom: commande.livreur?.user.nom ?? 'Livreur',
            autorise: terminee,
            avis: commande.avisLivreur
              ? {
                  note: commande.avisLivreur.note,
                  commentaire: commande.avisLivreur.commentaire,
                  createdAt: commande.avisLivreur.createdAt,
                }
              : null,
          }
        : null,
    };
  }

  async create(clientId: string, commandeId: string, dto: CreateAvisDto) {
    const commande = await this.getOwnedOrder(clientId, commandeId);
    if (!this.isCompleted(commande)) {
      throw new ConflictException('Vous pourrez laisser un avis après la livraison.');
    }

    const commentaire = dto.commentaire?.trim() || null;
    try {
      if (dto.cible === 'partenaire') {
        const partenaireId = commande.commandeRepas?.partenaireId;
        if (!partenaireId) {
          throw new ConflictException('Cette commande ne permet pas de noter un partenaire.');
        }
        return await this.prisma.$transaction(async (tx) => {
          const avis = await tx.avisPartenaire.create({
            data: { commandeId, partenaireId, note: dto.note, commentaire },
          });
          const moyenne = await tx.avisPartenaire.aggregate({
            where: { partenaireId },
            _avg: { note: true },
          });
          await tx.partenaire.update({
            where: { id: partenaireId },
            data: { noteMoyenne: moyenne._avg.note },
          });
          return avis;
        });
      }

      if (!commande.livreurId) {
        throw new ConflictException('Aucun livreur n’est encore associé à cette commande.');
      }
      return await this.prisma.$transaction(async (tx) => {
        const avis = await tx.avisLivreur.create({
          data: { commandeId, livreurId: commande.livreurId!, note: dto.note, commentaire },
        });
        const moyenne = await tx.avisLivreur.aggregate({
          where: { livreurId: commande.livreurId! },
          _avg: { note: true },
        });
        await tx.livreur.update({
          where: { id: commande.livreurId! },
          data: { noteMoyenne: moyenne._avg.note },
        });
        return avis;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un avis a déjà été envoyé pour cette commande.');
      }
      throw error;
    }
  }

  private async getOwnedOrder(clientId: string, commandeId: string) {
    const commande = await this.prisma.commande.findFirst({
      where: { id: commandeId, clientId },
      include: COMMANDE_INCLUDE,
    });
    if (!commande) throw new NotFoundException('Commande introuvable.');
    return commande;
  }

  private isCompleted(commande: Prisma.CommandeGetPayload<{ include: typeof COMMANDE_INCLUDE }>) {
    if (commande.typeService === TypeService.repas) {
      return commande.commandeRepas?.statut === StatutRepas.livree;
    }
    if (commande.typeService === TypeService.colis) {
      return commande.commandeColis?.statut === StatutColis.livre;
    }
    if (commande.typeService === TypeService.courses_express) {
      return commande.commandeCoursesExpress?.statut === StatutCoursesExpress.terminee;
    }
    return false;
  }
}
