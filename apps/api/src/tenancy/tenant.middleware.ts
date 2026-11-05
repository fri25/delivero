import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { lierAuTenant } from './contexte-tenant';
import { ResolutionTenantService } from './resolution-tenant.service';

/**
 * Binds every HTTP request to its company before guards and controllers
 * run: the Prisma extension then scopes all their queries to it.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly resolution: ResolutionTenantService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = await this.resolution.resoudre(req);
    req.tenantId = tenantId;
    lierAuTenant(tenantId, next);
  }
}
