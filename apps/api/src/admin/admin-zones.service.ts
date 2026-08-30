import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

const ZONE_INCLUDE = {
  grilleTarifaireColis: { select: { tarifBase: true } },
  grilleTarifaireCoursesExpress: { select: { tarifBase: true } },
} as const;

@Injectable()
export class AdminZonesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.zone.findMany({
      include: ZONE_INCLUDE,
      orderBy: { nom: 'asc' },
    });
  }

  async create(dto: CreateZoneDto) {
    const existing = await this.prisma.zone.findUnique({
      where: { nom: dto.nom },
    });
    if (existing) {
      throw new ConflictException('Une zone porte déjà ce nom.');
    }

    return this.prisma.$transaction(async (tx) => {
      const zone = await tx.zone.create({
        data: {
          nom: dto.nom,
          description: dto.description,
          fraisLivraison: dto.fraisLivraison,
        },
      });
      await tx.grilleTarifaireColis.create({
        data: { zoneId: zone.id, tarifBase: dto.tarifBaseColis },
      });
      await tx.grilleTarifaireCoursesExpress.create({
        data: { zoneId: zone.id, tarifBase: dto.tarifBaseCoursesExpress },
      });
      return tx.zone.findUniqueOrThrow({
        where: { id: zone.id },
        include: ZONE_INCLUDE,
      });
    });
  }

  async update(id: string, dto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.description !== undefined || dto.fraisLivraison !== undefined) {
        await tx.zone.update({
          where: { id },
          data: {
            description: dto.description,
            fraisLivraison: dto.fraisLivraison,
          },
        });
      }
      if (dto.tarifBaseColis !== undefined) {
        await tx.grilleTarifaireColis.upsert({
          where: { zoneId: id },
          update: { tarifBase: dto.tarifBaseColis },
          create: { zoneId: id, tarifBase: dto.tarifBaseColis },
        });
      }
      if (dto.tarifBaseCoursesExpress !== undefined) {
        await tx.grilleTarifaireCoursesExpress.upsert({
          where: { zoneId: id },
          update: { tarifBase: dto.tarifBaseCoursesExpress },
          create: { zoneId: id, tarifBase: dto.tarifBaseCoursesExpress },
        });
      }
      return tx.zone.findUniqueOrThrow({
        where: { id },
        include: ZONE_INCLUDE,
      });
    });
  }
}
