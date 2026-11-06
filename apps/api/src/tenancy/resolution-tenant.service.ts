import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { PrismaService } from '../prisma/prisma.service';

interface TenantResolu {
  id: string;
  statut: string;
}

const DUREE_CACHE_MS = 60_000;

const nomHote = (valeur: string | undefined): string | null => {
  if (!valeur) return null;
  try {
    return new URL(
      valeur.includes('://') ? valeur : `http://${valeur}`,
    ).hostname.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Company of a request (étape 4 of docs/plan-migration-multi-tenant.md):
 * X-Tenant header (slug), else the Origin of the app that calls, else the
 * Host, looked up in tenant_domains. Until a second company opens (étape 10)
 * an unknown domain falls back on CHAP EXPRESS, logged so a misconfigured
 * domain does not go unnoticed. tenants and tenant_domains are platform
 * tables: these lookups need no company context.
 */
@Injectable()
export class ResolutionTenantService {
  private readonly logger = new Logger(ResolutionTenantService.name);
  private readonly cache = new Map<
    string,
    { tenant: TenantResolu | null; expire: number }
  >();
  private readonly hotesSignales = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async resoudre(req: Request): Promise<string> {
    const slug = req.header('x-tenant')?.trim().toLowerCase();
    if (slug) {
      const tenant = await this.enCache(`slug:${slug}`, () =>
        this.prisma.tenant.findUnique({
          where: { slug },
          select: { id: true, statut: true },
        }),
      );
      if (!tenant) {
        throw new NotFoundException('Entreprise inconnue.');
      }
      return this.verifierStatut(tenant);
    }

    for (const hote of [
      nomHote(req.header('origin')),
      nomHote(req.header('host')),
    ]) {
      if (!hote) continue;
      const tenant = await this.parDomaine(hote);
      if (tenant) return this.verifierStatut(tenant);
    }

    const hote =
      nomHote(req.header('origin')) ?? nomHote(req.header('host')) ?? '?';
    if (!this.hotesSignales.has(hote)) {
      this.hotesSignales.add(hote);
      this.logger.warn(
        `Domaine ${hote} inconnu : repli sur CHAP EXPRESS (étape 10 : refusé).`,
      );
    }
    return TENANT_PAR_DEFAUT;
  }

  /** After a change by the platform (status, domains), étape 9. */
  oublier() {
    this.cache.clear();
  }

  /** For CORS: is this browser origin the domain of a company? */
  async origineConnue(origine: string): Promise<boolean> {
    const hote = nomHote(origine);
    return hote ? (await this.parDomaine(hote)) !== null : false;
  }

  private parDomaine(hote: string) {
    return this.enCache(`domaine:${hote}`, async () => {
      const domaine = await this.prisma.tenantDomain.findUnique({
        where: { domaine: hote },
        select: { tenant: { select: { id: true, statut: true } } },
      });
      return domaine?.tenant ?? null;
    });
  }

  private verifierStatut(tenant: TenantResolu): string {
    if (tenant.statut !== 'actif') {
      throw new ForbiddenException('Cette entreprise est suspendue.');
    }
    return tenant.id;
  }

  private async enCache(
    cle: string,
    charger: () => Promise<TenantResolu | null>,
  ): Promise<TenantResolu | null> {
    const entree = this.cache.get(cle);
    if (entree && entree.expire > Date.now()) return entree.tenant;
    const tenant = await charger();
    this.cache.set(cle, { tenant, expire: Date.now() + DUREE_CACHE_MS });
    return tenant;
  }
}
