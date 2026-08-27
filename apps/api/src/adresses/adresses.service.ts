import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdresseDto } from './dto/create-adresse.dto';
import { UpdateAdresseDto } from './dto/update-adresse.dto';

@Injectable()
export class AdressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.adresse.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateAdresseDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.estParDefaut) {
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
          estParDefaut: dto.estParDefaut ?? false,
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

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.prisma.adresse.delete({ where: { id } });
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
    if (!adresse || adresse.userId !== userId) {
      throw new NotFoundException('Adresse introuvable.');
    }
    return adresse;
  }
}
