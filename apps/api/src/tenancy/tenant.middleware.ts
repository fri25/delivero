import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { lierAuTenant, lierEnPlateforme } from './contexte-tenant';
import { ResolutionTenantService } from './resolution-tenant.service';

// Never bound to the company of the domain they are called from: the
// platform super-admin API (étape 9), the health check (Render), the
// FedaPay webhooks and the PWA manifests, which name their company in the
// path (étape 10: an unknown domain is refused, and FedaPay or a browser
// fetching a manifest call without the app's headers).
const ROUTES_PLATEFORME =
  /^\/api\/(plateforme|health|paiements\/webhook|tenant\/[a-z0-9-]+\/(manifeste|icone))(\/|\?|\.|$)/;

/**
 * Binds every HTTP request to its company before guards and controllers
 * run: the Prisma extension then scopes all their queries to it.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly resolution: ResolutionTenantService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    if (ROUTES_PLATEFORME.test(req.originalUrl)) {
      lierEnPlateforme(next);
      return;
    }
    const tenantId = await this.resolution.resoudre(req);
    req.tenantId = tenantId;
    lierAuTenant(tenantId, next);
  }
}
