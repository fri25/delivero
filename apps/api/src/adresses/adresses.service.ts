import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuartiersService } from '../quartiers/quartiers.service';
import { CreateAdresseDto } from './dto/create-adresse.dto';
import { UpdateAdresseDto } from './dto/update-adresse.dto';

// The priced neighbourhood travels with every address: the client shows the
// delivery fee before ordering (RG-08 transparent breakdown).
const INCLUDE_QUARTIER = {
  quartierTarifaire: {
    select: { id: true, nom: true, fraisLivraison: true, autre: true },
  },
} as const;

@Injectable()
export class AdressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quartiers: QuartiersService,
  ) {}

  findAllForUser(userId: string) {
    return this.prisma.adresse.findMany({
      where: { userId, archiveeAt: null },
      include: INCLUDE_QUARTIER,
      orderBy: [{ estParDefaut: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAdresseDto) {
    const { quartier, nom } = await this.quartiers.resoudre(
      dto.quartierId,
      dto.quartier,
    );
    return this.prisma.$transaction(async (tx) => {
      // The first address of an account is its default one.
      const existantes = await tx.adresse.count({
        where: { userId, archiveeAt: null },
      });
      const estParDefaut = dto.estParDefaut === true || existantes === 0;
      if (estParDefaut) {
        await tx.adresse.updateMany({
          where: { userId },
          data: { estParDefaut: false },
        });
      }
      return tx.adresse.create({
        data: {
          userId,
          libelle: dto.libelle,
          adresse: dto.adresse,
          quartierId: quartier.id,
          quartier: nom,
          pointDeRepere: dto.pointDeRepere,
          latitude: dto.latitude,
          longitude: dto.longitude,
          estParDefaut,
        },
        include: INCLUDE_QUARTIER,
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAdresseDto) {
    const existante = await this.findOwned(userId, id);
    const { quartierId, quartier: precision, ...reste } = dto;
    let quartier: { quartierId: string; quartier: string } | undefined;
    if (quartierId !== undefined || precision !== undefined) {
      const idQuartier = quartierId ?? existante.quartierId;
      if (!idQuartier) {
        throw new BadRequestException(
          'Choisissez le quartier de cette adresse.',
        );
      }
      const resolu = await this.quartiers.resoudre(
        idQuartier,
        precision ?? existante.quartier,
      );
      quartier = { quartierId: resolu.quartier.id, quartier: resolu.nom };
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.estParDefaut) {
        await tx.adresse.updateMany({
          where: { userId },
          data: { estParDefaut: false },
        });
      }
      return tx.adresse.update({
        where: { id },
        data: { ...reste, ...quartier },
        include: INCLUDE_QUARTIER,
      });
    });
  }

  // Archived, not deleted (see Adresse.archiveeAt). If it was the default,
  // the most recent remaining address takes over.
  async remove(userId: string, id: string) {
    const adresse = await this.findOwned(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.adresse.update({
        where: { id },
        data: { archiveeAt: new Date(), estParDefaut: false },
      });
      if (!adresse.estParDefaut) {
        return;
      }
      const suivante = await tx.adresse.findFirst({
        where: { userId, archiveeAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (suivante) {
        await tx.adresse.update({
          where: { id: suivante.id },
          data: { estParDefaut: true },
        });
      }
    });
  }

  async setDefault(userId: string, id: string) {
    await this.findOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.adresse.updateMany({
        where: { userId },
        data: { estParDefaut: false },
      });
      return tx.adresse.update({
        where: { id },
        data: { estParDefaut: true },
        include: INCLUDE_QUARTIER,
      });
    });
  }

  async findOwned(userId: string, id: string) {
    const adresse = await this.prisma.adresse.findUnique({ where: { id } });
    if (!adresse || adresse.userId !== userId || adresse.archiveeAt) {
      throw new NotFoundException('Adresse introuvable.');
    }
    return adresse;
  }
}
