import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ROLES } from '../auth/roles';
import { PrismaService } from '../prisma/prisma.service';
import type { ListerClientsDto } from './dto/lister-clients.dto';

const PAR_PAGE = 50;

/**
 * Clients of the company (étape 8): its memberships with the client role.
 * Order counts come from a separate query on commandes, scoped to the
 * company by the extension and RLS: a nested _count on users would cross
 * companies.
 */
@Injectable()
export class EntrepriseClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(filtre: ListerClientsDto) {
    const parPage = filtre.parPage ?? PAR_PAGE;
    const page = filtre.page ?? 1;
    const recherche = filtre.recherche?.trim();
    const where: Prisma.MembershipWhereInput = {
      role: { name: ROLES.client },
      ...(recherche
        ? {
            user: {
              OR: [
                { nom: { contains: recherche, mode: 'insensitive' } },
                { telephone: { contains: recherche.replace(/\s/g, '') } },
              ],
            },
          }
        : {}),
    };
    const [total, lignes] = await Promise.all([
      this.prisma.membership.count({ where }),
      this.prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * parPage,
        take: parPage,
        select: {
          statut: true,
          createdAt: true,
          user: { select: { id: true, nom: true, telephone: true } },
        },
      }),
    ]);
    const ids = lignes.map((l) => l.user.id);
    const commandes = ids.length
      ? await this.prisma.commande.groupBy({
          by: ['clientId'],
          where: { clientId: { in: ids } },
          _count: { _all: true },
          _max: { createdAt: true },
        })
      : [];
    const parClient = new Map(commandes.map((c) => [c.clientId, c]));
    return {
      total,
      page,
      parPage,
      clients: lignes.map((l) => ({
        id: l.user.id,
        nom: l.user.nom,
        telephone: l.user.telephone,
        statut: l.statut,
        inscritLe: l.createdAt,
        commandes: parClient.get(l.user.id)?._count._all ?? 0,
        derniereCommande: parClient.get(l.user.id)?._max.createdAt ?? null,
      })),
    };
  }
}
