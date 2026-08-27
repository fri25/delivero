import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LivreursService {
  constructor(private readonly prisma: PrismaService) {}

  async getOwn(userId: string) {
    const livreur = await this.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur) {
      throw new NotFoundException('Aucun profil livreur associé à ce compte.');
    }
    return livreur;
  }

  async toggleDisponibilite(userId: string, disponible: boolean) {
    const livreur = await this.getOwn(userId);
    return this.prisma.livreur.update({
      where: { id: livreur.id },
      data: { disponible },
    });
  }
}
