import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { lierAuTenant, lierEnPlateforme } from './contexte-tenant';

// Platform super-admin API (étape 9): never bound to the company of the
// domain it is called from.
const ROUTES_PLATEFORME = /^\/api\/plateforme(\/|\?|$)/;
import { ResolutionTenantService } from './resolution-tenant.service';

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
