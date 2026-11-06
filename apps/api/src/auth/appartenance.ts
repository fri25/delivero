import { UnauthorizedException } from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';

/**
 * CHAP EXPRESS, tenant n°1, inserted with this fixed id by migration
 * plateforme_tenants. Since étape 4 it is only the fallback of an unknown
 * domain (until étape 10) and of tokens issued before étape 4.
 */
export const TENANT_PAR_DEFAUT = 'tnt_chapexpress';

// Étape 8: the profile lists the permissions, the admin app shows only the
// screens of its role.
const permissionsDuRole = {
  permissions: { include: { permission: true } },
} as const satisfies Prisma.RoleInclude;

/**
 * Loads a user's membership in a company and, as a fallback, the legacy
 * users.role_id (only meaningful for CHAP EXPRESS, removed at étape 10).
 */
export const avecRole = (tenantId: string) =>
  ({
    role: { include: permissionsDuRole },
    memberships: {
      where: { tenantId },
      include: { role: { include: permissionsDuRole } },
    },
  }) satisfies Prisma.UserInclude;

export type UtilisateurAvecRole = Prisma.UserGetPayload<{
  include: ReturnType<typeof avecRole>;
}>;

interface AvecAppartenances<R> {
  role: R;
  memberships: Array<{ statut: string; role: R }>;
}

/**
 * The user's role in the company. No membership: the legacy role for CHAP
 * EXPRESS (account created by the previous API version during a deployment),
 * no access anywhere else. A suspended membership closes the access.
 */
export function roleEffectif<R extends Pick<Role, 'name'>>(
  user: AvecAppartenances<R>,
  tenantId: string,
): R {
  const [appartenance] = user.memberships;
  if (!appartenance) {
    if (tenantId === TENANT_PAR_DEFAUT) {
      return user.role;
    }
    throw new UnauthorizedException('Aucun accès à cette entreprise.');
  }
  if (appartenance.statut !== 'actif') {
    throw new UnauthorizedException('Accès suspendu pour ce compte.');
  }
  return appartenance.role;
}

/**
 * Nested write that makes a new account a member of the company of the
 * request (set by the Prisma extension) with its role. users.role_id is
 * still set by the caller, for the previous API version.
 */
export function appartenanceInitiale(
  roleId: string,
): Prisma.UserUncheckedCreateInput['memberships'] {
  return { create: { roleId } as { roleId: string; tenantId: string } };
}
