import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const request = context.switchToHttp().getRequest<Request>();
      if (!request.user || !requiredRoles.includes(request.user.role)) {
        throw new ForbiddenException('Accès refusé pour ce rôle.');
      }
    }

    // V13 : au-delà du rôle, un contrôleur peut exiger des permissions
    // précises (voir RequirePermissions) — seul admin_dispatcher en porte
    // aujourd'hui (docs/acteurs.md), mais un rôle admin plus restreint
    // pourra les échouer sans changement de code.
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredPermissions && requiredPermissions.length > 0) {
      const request = context.switchToHttp().getRequest<Request>();
      const userPermissions = request.user?.permissions ?? [];
      const hasAll = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
      if (!hasAll) {
        throw new ForbiddenException(
          'Permission manquante pour cette action.',
        );
      }
    }

    return true;
  }
}
