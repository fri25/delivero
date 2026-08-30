import { Injectable, NotFoundException } from '@nestjs/common';
import { PortefeuilleService } from '../portefeuille/portefeuille.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LivreursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portefeuille: PortefeuilleService,
  ) {}

  async getOwn(userId: string) {
    const livreur = await this.prisma.livreur.findUnique({ where: { userId } });
    if (!livreur) {
      throw new NotFoundException('Aucun profil livreur associé à ce compte.');
    }
    return livreur;
  }

  async getPortefeuille(userId: string) {
    const livreur = await this.getOwn(userId);
    return this.portefeuille.getResume(
      livreur.id,
      livreur.plafondAvance,
      livreur.plafondCaisse,
    );
  }

  async toggleDisponibilite(userId: string, disponible: boolean) {
    const livreur = await this.getOwn(userId);
    return this.prisma.livreur.update({
      where: { id: livreur.id },
      data: { disponible },
    });
  }

  async cloturerCaisse(userId: string, montantDeclare: number) {
    const livreur = await this.getOwn(userId);
    return this.portefeuille.cloturerCaisse(livreur.id, montantDeclare);
  }

  async getClotures(userId: string) {
    const livreur = await this.getOwn(userId);
    return this.prisma.clotureCaisse.findMany({
      where: { livreurId: livreur.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
