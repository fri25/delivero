import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TypePartenaire } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  normaliserTelephoneBenin,
  variantesTelephone,
} from '../auth/telephone';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartenaireDto } from './dto/create-partenaire.dto';
import { UpdatePartenaireDto } from './dto/update-partenaire.dto';

const SALT_ROUNDS = 12;
const RESTAURANT_ROLE_NAME = 'restaurant';

const PARTENAIRE_SELECT = {
  id: true,
  nom: true,
  type: true,
  description: true,
  adresse: true,
  pointDeRepere: true,
  statutOuverture: true,
  suspendu: true,
  noteMoyenne: true,
  createdAt: true,
  user: { select: { nom: true, telephone: true } },
  zone: { select: { id: true, nom: true } },
  _count: { select: { plats: true, commandesRepas: true } },
} satisfies Prisma.PartenaireSelect;

// F-ADM-08 — restaurants only: the Commerce partenaire module (F-COM) does
// not exist yet. No commission field here: for Repas the 15 % commission is
// billed to the client and the restaurant is paid in full (RG-08), so the
// per-partner rate has no effect today.
@Injectable()
export class AdminPartenairesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.partenaire.findMany({
      where: { type: TypePartenaire.restaurant },
      select: PARTENAIRE_SELECT,
      orderBy: { nom: 'asc' },
    });
  }

  async create(dto: CreatePartenaireDto) {
    const telephone = normaliserTelephoneBenin(dto.telephone);
    if (!telephone) {
      throw new BadRequestException(
        'Numéro béninois invalide (ex. 01 57 86 69 59).',
      );
    }
    const existing = await this.prisma.user.findFirst({
      where: { telephone: { in: variantesTelephone(telephone) } },
    });
    if (existing) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
    }
    await this.assertZone(dto.zoneId);
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: RESTAURANT_ROLE_NAME },
    });
    const passwordHash = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { telephone, nom: dto.nom, passwordHash, roleId: role.id },
      });
      // Created closed: the restaurant opens once its menu is in.
      return tx.partenaire.create({
        data: {
          userId: user.id,
          nom: dto.nom,
          type: TypePartenaire.restaurant,
          zoneId: dto.zoneId,
          pointDeRepere: dto.pointDeRepere,
          adresse: dto.adresse,
          description: dto.description,
          statutOuverture: false,
        },
        select: PARTENAIRE_SELECT,
      });
    });
  }

  async update(id: string, dto: UpdatePartenaireDto) {
    const partenaire = await this.getOrThrow(id);
    if (dto.zoneId) {
      await this.assertZone(dto.zoneId);
    }
    const passwordHash = dto.motDePasse
      ? await bcrypt.hash(dto.motDePasse, SALT_ROUNDS)
      : undefined;
    return this.prisma.partenaire.update({
      where: { id: partenaire.id },
      data: {
        nom: dto.nom,
        ...(dto.zoneId ? { zone: { connect: { id: dto.zoneId } } } : {}),
        pointDeRepere: dto.pointDeRepere,
        adresse: dto.adresse,
        ...(passwordHash ? { user: { update: { passwordHash } } } : {}),
      },
      select: PARTENAIRE_SELECT,
    });
  }

  /**
   * Suspension (F-ADM-08): hidden from clients and refuses new orders. The
   * restaurant still signs in and sees its history; orders already placed
   * carry on (the dispatcher cancels them if needed).
   */
  async suspendre(id: string, suspendu: boolean) {
    const partenaire = await this.getOrThrow(id);
    return this.prisma.partenaire.update({
      where: { id: partenaire.id },
      data: { suspendu },
      select: PARTENAIRE_SELECT,
    });
  }

  private async getOrThrow(id: string) {
    const partenaire = await this.prisma.partenaire.findFirst({
      where: { id, type: TypePartenaire.restaurant },
      select: { id: true },
    });
    if (!partenaire) {
      throw new NotFoundException('Restaurant introuvable.');
    }
    return partenaire;
  }

  private async assertZone(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundException('Zone introuvable.');
    }
  }
}
