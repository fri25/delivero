import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CLOTURE_INCLUDE = {
  livreur: { include: { user: { select: { nom: true, telephone: true } } } },
  rapprocheePar: { select: { nom: true } },
} as const;

// F-ADM-12 : rapprochement supervisé par le dispatcher (RG-03). Ne fait que
// prendre acte de l'écart calculé à la clôture (PortefeuilleService.
// cloturerCaisse) — aucune correction ni sanction automatique, la procédure
// exacte en cas d'écart reste [À ARBITRER] (docs/regles-gestion.md RG-03).
@Injectable()
export class AdminCaisseService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.clotureCaisse.findMany({
      include: CLOTURE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async rapprocher(id: string, adminUserId: string) {
    const cloture = await this.prisma.clotureCaisse.findUnique({
      where: { id },
    });
    if (!cloture) {
      throw new NotFoundException('Clôture introuvable.');
    }
    if (cloture.rapprocheeAt) {
      throw new ConflictException('Cette clôture a déjà été rapprochée.');
    }

    return this.prisma.clotureCaisse.update({
      where: { id },
      data: { rapprocheeAt: new Date(), rapprocheeParId: adminUserId },
      include: CLOTURE_INCLUDE,
    });
  }
}
