import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tenantCourant } from '../tenancy/contexte-tenant';
import type { ListerJournalDto } from './dto/lister-journal.dto';

const LIMITE_PAR_DEFAUT = 50;

/**
 * Activity journal of the company (étape 8). audit_logs is a platform
 * table (tenant_id null = platform event): the company is always named
 * explicitly, a company never reads another's entries nor the platform's.
 */
@Injectable()
export class EntrepriseJournalService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtre: ListerJournalDto) {
    const limite = filtre.limite ?? LIMITE_PAR_DEFAUT;
    const where: Prisma.AuditLogWhereInput = {
      tenantId: tenantCourant(),
      ...(filtre.action ? { action: { startsWith: filtre.action } } : {}),
      ...(filtre.acteurId ? { acteurId: filtre.acteurId } : {}),
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
