import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { roleEffectif, TENANT_PAR_DEFAUT } from '../appartenance';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/auth-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant.');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(authHeader.slice(7));
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré.');
    }

    // V05 : le rôle n'est plus pris tel quel dans le jeton mais relu en base
    // à chaque requête — un compte rétrogradé ou supprimé perd l'accès
    // immédiatement, sans attendre l'expiration du JWT (2h par défaut).
    // V13 : les permissions du rôle sont chargées ici (même requête) pour que
    // RolesGuard puisse les vérifier — jusqu'ici RolePermission était seedé
    // mais jamais lu, seul le nom du rôle comptait.
    // Étape 3 (docs/plan-migration-multi-tenant.md): the role comes from the
    // membership in the company, users.role_id only as a fallback.
    const avecPermissions = {
      include: { permissions: { include: { permission: true } } },
    } as const;
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: avecPermissions,
        memberships: {
          where: { tenantId: TENANT_PAR_DEFAUT },
          include: { role: avecPermissions },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Compte introuvable.');
    }
    const role = roleEffectif(user);

    request.user = {
      id: user.id,
      role: role.name,
      permissions: role.permissions.map((rp) => rp.permission.code),
    };
    return true;
  }
}
