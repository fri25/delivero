import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JournalPlateformeDto } from './dto/journal-plateforme.dto';

const LIMITE_PAR_DEFAUT = 50;

/** Platform journal (étape 9): every company, plus the platform's own. */
@Injectable()
export class PlateformeJournalService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtre: JournalPlateformeDto) {
    const limite = filtre.limite ?? LIMITE_PAR_DEFAUT;
    const where: Prisma.AuditLogWhereInput = {
      ...(filtre.entreprise === 'plateforme'
        ? { tenantId: null }
        : filtre.entreprise
          ? { tenantId: filtre.entreprise }
          : {}),
      ...(filtre.action ? { action: { startsWith: filtre.action } } : {}),
      ...(filtre.avant ? { createdAt: { lt: new Date(filtre.avant) } } : {}),
    };
    const lignes = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite + 1,
      select: {
        id: true,
        action: true,
        cibleType: true,
        cibleId: true,
        details: true,
        ip: true,
        createdAt: true,
        tenant: { select: { id: true, nom: true } },
        acteur: { select: { id: true, nom: true, telephone: true } },
      },
    });
    const page = lignes.slice(0, limite);
    return {
      entrees: page,
      suivant:
        lignes.length > limite
          ? (page[page.length - 1]?.createdAt.toISOString() ?? null)
          : null,
    };
  }
}
