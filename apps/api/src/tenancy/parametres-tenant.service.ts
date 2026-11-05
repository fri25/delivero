import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { PrismaService } from '../prisma/prisma.service';
import { tenantCourant } from './contexte-tenant';

export interface ParametresEntreprise {
  slug: string;
  nomCommercial: string;
  /** Service fee on Repas, in percent (15 for CHAP EXPRESS). */
  tauxCommission: number;
  fonctionnalites: ReadonlySet<string>;
  /** Verified main domain, null if none. */
  domainePrincipal: string | null;
}

const DUREE_CACHE_MS = 60_000;

/**
 * Settings and opened features of the company of the request (étape 5 of
 * docs/plan-migration-multi-tenant.md): what used to be hard-coded or in the
 * environment for CHAP EXPRESS. Platform tables, read without company
 * context; cached one minute.
 */
@Injectable()
export class ParametresTenantService {
  private readonly cache = new Map<
    string,
    { valeur: ParametresEntreprise; expire: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async courants(): Promise<ParametresEntreprise> {
    return this.pour(tenantCourant());
  }

  async pour(tenantId: string): Promise<ParametresEntreprise> {
    const entree = this.cache.get(tenantId);
    if (entree && entree.expire > Date.now()) return entree.valeur;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        parametres: true,
        fonctionnalites: { where: { actif: true } },
        domaines: { where: { principal: true, verifieAt: { not: null } } },
      },
    });
    // No silent default for a financial setting: a company without settings
    // cannot price an order (CLAUDE.md, garde-fous).
    if (!tenant?.parametres) {
      throw new ServiceUnavailableException(
        'Cette entreprise n’est pas encore configurée.',
      );
    }
    const valeur: ParametresEntreprise = {
      slug: tenant.slug,
      nomCommercial: tenant.parametres.nomCommercial,
      tauxCommission: Number(tenant.parametres.tauxCommission),
      fonctionnalites: new Set(tenant.fonctionnalites.map((f) => f.code)),
      domainePrincipal: tenant.domaines[0]?.domaine ?? null,
    };
    this.cache.set(tenantId, { valeur, expire: Date.now() + DUREE_CACHE_MS });
    return valeur;
  }

  /** After a change of settings (étape 8). */
  oublier(tenantId: string) {
    this.cache.delete(tenantId);
  }

  /**
   * Base URL of the client app of the company, for payment returns and
   * e-mail links. CHAP EXPRESS keeps its configured URL until its domains
   * are verified (étape 10): a wrong domain would break payment returns.
   */
  async urlApplicationClient(cleConfig: string, repli = ''): Promise<string> {
    const tenantId = tenantCourant();
    const configuree = (this.config.get<string>(cleConfig) ?? repli).replace(
      /\/+$/,
      '',
    );
    if (tenantId === TENANT_PAR_DEFAUT) return configuree;
    const { domainePrincipal } = await this.pour(tenantId);
    return domainePrincipal ? `https://${domainePrincipal}` : configuree;
  }
}
