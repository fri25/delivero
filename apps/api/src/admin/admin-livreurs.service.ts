import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLivreurDto } from './dto/create-livreur.dto';
import { UpdateLivreurDto } from './dto/update-livreur.dto';

const SALT_ROUNDS = 12;
const LIVREUR_ROLE_NAME = 'livreur';

const LIVREUR_INCLUDE = {
  user: { select: { nom: true, telephone: true } },
  zone: { select: { id: true, nom: true } },
} as const;

// F-ADM-09 : enregistrement, zones, plafonds. "Pièces" (documents
// d'identité) hors périmètre — aucun stockage de fichiers S3 intégré (voir
// CLAUDE.md [À FAIRE]). "Performance" (statistiques de livraison) hors
// périmètre de cette passe, nécessiterait d'agréger les 4 services.
@Injectable()
export class AdminLivreursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
  ) {}

  // Enrichi avec le solde portefeuille (avance en cours, caisse à reverser) —
  // voir docs/modules.md F-LIV-09. Un appel Prisma par livreur : acceptable
  // vu le nombre de livreurs visé pour un dispatcher unique.
  async findAll() {
    const livreurs = await this.prisma.livreur.findMany({
      include: LIVREUR_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      livreurs.map(async (livreur) => {
        const { avanceEnCours, caisseAReverser } =
          await this.portefeuille.getResume(
            livreur.id,
            livreur.plafondAvance,
            livreur.plafondCaisse,
          );
        return { ...livreur, avanceEnCours, caisseAReverser };
      }),
    );
  }

  async create(dto: CreateLivreurDto) {
    const existing = await this.prisma.user.findUnique({
      where: { telephone: dto.telephone },
    });
    if (existing) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
    }

    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }

    const livreurRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: LIVREUR_ROLE_NAME },
    });
    const passwordHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          telephone: dto.telephone,
          nom: dto.nom,
          passwordHash,
          roleId: livreurRole.id,
        },
      });
      return tx.livreur.create({
        data: {
          userId: user.id,
          zoneId: dto.zoneId,
          plafondAvance: dto.plafondAvance,
          plafondCaisse: dto.plafondCaisse,
        },
        include: LIVREUR_INCLUDE,
      });
    });
  }

  async update(id: string, dto: UpdateLivreurDto) {
    const livreur = await this.prisma.livreur.findUnique({ where: { id } });
    if (!livreur) {
      throw new NotFoundException('Livreur introuvable.');
    }
    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
      });
      if (!zone) {
        throw new NotFoundException('Zone introuvable.');
      }
    }

    const passwordHash = dto.motDePasse
      ? await bcrypt.hash(dto.motDePasse, SALT_ROUNDS)
      : undefined;

    return this.prisma.livreur.update({
      where: { id },
      data: {
        ...(dto.zoneId ? { zone: { connect: { id: dto.zoneId } } } : {}),
        plafondAvance: dto.plafondAvance,
        plafondCaisse: dto.plafondCaisse,
        ...(passwordHash
          ? { user: { update: { passwordHash } } }
          : {}),
      },
      include: LIVREUR_INCLUDE,
    });
  }

  async remove(id: string) {
    const livreur = await this.prisma.livreur.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    if (!livreur) {
      throw new NotFoundException('Livreur introuvable.');
    }

    const [commandes, mouvements, clotures] = await Promise.all([
      this.prisma.commande.count({ where: { livreurId: id } }),
      this.prisma.mouvementPortefeuille.count({ where: { livreurId: id } }),
      this.prisma.clotureCaisse.count({ where: { livreurId: id } }),
    ]);
    if (commandes || mouvements || clotures) {
      throw new ConflictException(
        'Impossible de supprimer ce livreur : son compte est associé à un historique de commandes ou de caisse.',
      );
    }

    await this.prisma.user.delete({ where: { id: livreur.userId } });
    return { id };
  }
}
