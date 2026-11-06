import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { tenantCourant } from '../../tenancy/contexte-tenant';
import { JournalSecuriteService } from '../../tenancy/journal-securite.service';
import { roleEffectif, TENANT_PAR_DEFAUT } from '../appartenance';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/auth-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly journal: JournalSecuriteService,
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

    // Étape 9: a platform session opens /api/plateforme only. Without this
    // check, its missing tid would read as CHAP EXPRESS.
    if (payload.scope === 'plateforme') {
      throw new UnauthorizedException('Session plateforme : accès refusé ici.');
    }

    // Étape 4 (docs/plan-migration-multi-tenant.md): a session belongs to
    // one company. Tokens issued before étape 4 carry no tid: CHAP EXPRESS.
    const tenantId = tenantCourant();
    if ((payload.tid ?? TENANT_PAR_DEFAUT) !== tenantId) {
      await this.journal.signaler({
        action: 'securite.jeton_autre_entreprise',
        tenantId,
        acteurId: payload.sub,
        ip: request.ip,
        details: { tidJeton: payload.tid ?? null, chemin: request.path },
      });
      throw new ForbiddenException(
        'Ce compte appartient à une autre entreprise.',
      );
    }

    // V05 : le rôle n'est plus pris tel quel dans le jeton mais relu en base
    // à chaque requête — un compte rétrogradé ou supprimé perd l'accès
    // immédiatement, sans attendre l'expiration du JWT (2h par défaut).
    // V13 : les permissions du rôle sont chargées ici (même requête) pour que
    // RolesGuard puisse les vérifier.
    // Étape 3 : le rôle vient de l'appartenance à l'entreprise.
    const avecPermissions = {
      include: { permissions: { include: { permission: true } } },
    } as const;
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: avecPermissions,
        memberships: {
          where: { tenantId },
          include: { role: avecPermissions },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Compte introuvable.');
    }
    const role = roleEffectif(user, tenantId);

    request.user = {
      id: user.id,
      role: role.name,
      permissions: role.permissions.map((rp) => rp.permission.code),
    };
    return true;
  }
}
