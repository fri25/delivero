import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Platform super-admin routes (étape 9 of docs/plan-migration-multi-tenant.md).
 * A platform session (scope "plateforme") of an account still listed in
 * platform_admins; a company session, admin_entreprise included, is
 * refused. Re-read on every request: removing the row closes the access.
 */
@Injectable()
export class PlateformeAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requete = context.switchToHttp().getRequest<Request>();
    const entete = requete.headers.authorization;
    if (!entete?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant.');
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(entete.slice(7));
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré.');
    }
    // A valid session, but not a platform one (403, not 401: signing in
    // again with it changes nothing).
    if (payload.scope !== 'plateforme') {
      throw new ForbiddenException('Réservé à l’équipe de la plateforme.');
    }
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { userId: payload.sub },
    });
    if (!admin) {
      throw new ForbiddenException('Réservé à l’équipe de la plateforme.');
    }
    requete.plateformeAdminId = admin.userId;
    return true;
  }
}
