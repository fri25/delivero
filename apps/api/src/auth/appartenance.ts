import { UnauthorizedException } from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';

/**
 * CHAP EXPRESS, the only company until étape 4 of
 * docs/plan-migration-multi-tenant.md resolves the company of each request.
 * Inserted with this fixed id by migration plateforme_tenants.
 */
export const TENANT_PAR_DEFAUT = 'tnt_chapexpress';

/**
 * Loads a user's role in the company (membership) and, as a fallback, the
 * legacy users.role_id: an account created by the previous API version
 * during a deployment has no membership yet. Removed at étape 7.
 */
export const AVEC_ROLE = {
  role: true,
  memberships: {
    where: { tenantId: TENANT_PAR_DEFAUT },
    include: { role: true },
  },
} satisfies Prisma.UserInclude;

export type UtilisateurAvecRole = Prisma.UserGetPayload<{
  include: typeof AVEC_ROLE;
}>;

interface AvecAppartenances<R> {
  role: R;
  memberships: Array<{ statut: string; role: R }>;
}

/**
 * The user's role in the company. A suspended membership closes the access
 * even though the legacy column still carries a role.
 */
export function roleEffectif<R extends Pick<Role, 'name'>>(
  user: AvecAppartenances<R>,
): R {
  const [appartenance] = user.memberships;
  if (!appartenance) {
    return user.role;
  }
  if (appartenance.statut !== 'actif') {
    throw new UnauthorizedException('Accès suspendu pour ce compte.');
  }
  return appartenance.role;
}

/**
 * Nested write that makes a new account a member of the company with its
 * role. users.role_id is still set by the caller, for the previous API
 * version (expand/contract, see the plan).
 */
export function appartenanceInitiale(
  roleId: string,
): Prisma.UserUncheckedCreateInput['memberships'] {
  return { create: { tenantId: TENANT_PAR_DEFAUT, roleId } };
}
