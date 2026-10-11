import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdresseDto } from './dto/create-adresse.dto';
import { UpdateAdresseDto } from './dto/update-adresse.dto';

@Injectable()
export class AdressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.adresse.findMany({
      where: { userId, archiveeAt: null },
      orderBy: [{ estParDefaut: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(userId: string, dto: CreateAdresseDto) {
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
          pointDeRepere: dto.pointDeRepere,
          latitude: dto.latitude,
          longitude: dto.longitude,
          estParDefaut,
        },
      });
    });
  }

  async update(userId: string, id: string, dto: UpdateAdresseDto) {
    await this.findOwned(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.estParDefaut) {
        await tx.adresse.updateMany({
          where: { userId },
          data: { estParDefaut: false },
        });
      }
      return tx.adresse.update({ where: { id }, data: dto });
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
      return tx.adresse.update({ where: { id }, data: { estParDefaut: true } });
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
