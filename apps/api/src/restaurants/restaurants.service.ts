import { Injectable, NotFoundException } from '@nestjs/common';
import { TypePartenaire } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatDto } from './dto/create-plat.dto';
import { UpdatePlatDto } from './dto/update-plat.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublic(search?: string) {
    return this.prisma.partenaire.findMany({
      where: {
        type: TypePartenaire.restaurant,
        statutOuverture: true,
        ...(search
          ? { nom: { contains: search, mode: 'insensitive' as const } }
          : {}),
      },
      select: {
        id: true,
        nom: true,
        description: true,
        horaires: true,
        noteMoyenne: true,
        statutOuverture: true,
      },
      orderBy: { nom: 'asc' },
    });
  }

  // V06 : projection en liste blanche — un `include` sans `select` renvoyait
  // tous les champs scalaires de Partenaire, dont userId, tauxCommission,
  // latitude/longitude et zoneId (aucun usage client à ce stade, aucune
  // intégration Maps réelle — voir CLAUDE.md [À FAIRE]).
  async findOnePublic(id: string) {
    const restaurant = await this.prisma.partenaire.findFirst({
      where: { id, type: TypePartenaire.restaurant },
      select: {
        id: true,
        nom: true,
        description: true,
        horaires: true,
        adresse: true,
        pointDeRepere: true,
        statutOuverture: true,
        noteMoyenne: true,
        plats: { orderBy: [{ categorie: 'asc' }, { nom: 'asc' }] },
        zone: { select: { fraisLivraison: true } },
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable.');
    }
    // Frais de livraison à plat pour le client (RG-08) : la zone elle-même
    // reste un détail d'implémentation côté zones de tarification.
    const { zone, ...rest } = restaurant;
    return { ...rest, fraisLivraison: zone.fraisLivraison };
  }

  async getOwn(userId: string) {
    const partenaire = await this.prisma.partenaire.findFirst({
      where: { userId, type: TypePartenaire.restaurant },
    });
    if (!partenaire) {
      throw new NotFoundException('Aucun restaurant associé à ce compte.');
    }
    return partenaire;
  }

  async updateOwn(userId: string, dto: UpdateRestaurantDto) {
    const partenaire = await this.getOwn(userId);
    return this.prisma.partenaire.update({
      where: { id: partenaire.id },
      data: dto,
    });
  }

  async toggleOuverture(userId: string, statutOuverture: boolean) {
    const partenaire = await this.getOwn(userId);
    return this.prisma.partenaire.update({
      where: { id: partenaire.id },
      data: { statutOuverture },
    });
  }

  async listOwnPlats(userId: string) {
    const partenaire = await this.getOwn(userId);
    return this.prisma.plat.findMany({
      where: { partenaireId: partenaire.id },
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
    });
  }

  async createPlat(userId: string, dto: CreatePlatDto) {
    const partenaire = await this.getOwn(userId);
    return this.prisma.plat.create({
      data: { ...dto, partenaireId: partenaire.id },
    });
  }

  async updatePlat(userId: string, platId: string, dto: UpdatePlatDto) {
    const plat = await this.getOwnPlat(userId, platId);
    return this.prisma.plat.update({ where: { id: plat.id }, data: dto });
  }

  async togglePlatDisponibilite(
    userId: string,
    platId: string,
    disponible: boolean,
  ) {
    const plat = await this.getOwnPlat(userId, platId);
    return this.prisma.plat.update({
      where: { id: plat.id },
      data: { disponible },
    });
  }

  async removePlat(userId: string, platId: string) {
    const plat = await this.getOwnPlat(userId, platId);
    await this.prisma.plat.delete({ where: { id: plat.id } });
  }

  private async getOwnPlat(userId: string, platId: string) {
    const partenaire = await this.getOwn(userId);
    const plat = await this.prisma.plat.findUnique({ where: { id: platId } });
    if (!plat || plat.partenaireId !== partenaire.id) {
      throw new NotFoundException('Plat introuvable.');
    }
    return plat;
  }
}
