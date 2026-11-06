/**
 * Role codes (roles.name). Étape 8 of docs/plan-migration-multi-tenant.md:
 * the company's back-office has two roles, admin_entreprise (everything,
 * settings and users included) and gestionnaire (day-to-day operations).
 * admin_dispatcher, the CHAP EXPRESS role until now, carries the same
 * permissions as admin_entreprise until its memberships are renamed
 * (étape 10): an account keeps its access during the deployment.
 */
export const ROLES = {
  client: 'client',
  restaurant: 'restaurant',
  commerce: 'commerce',
  livreur: 'livreur',
  adminEntreprise: 'admin_entreprise',
  gestionnaire: 'gestionnaire',
  /** @deprecated alias of admin_entreprise, renamed at étape 10. */
  adminDispatcher: 'admin_dispatcher',
  direction: 'direction',
} as const;

/** Roles that open the back-office; what each may do is in its permissions. */
export const ROLES_BACK_OFFICE: readonly string[] = [
  ROLES.adminEntreprise,
  ROLES.gestionnaire,
  ROLES.adminDispatcher,
];

/** Roles a company admin may give from the Users screen. */
export const ROLES_ATTRIBUABLES = [
  ROLES.adminEntreprise,
  ROLES.gestionnaire,
] as const;
export type RoleAttribuable = (typeof ROLES_ATTRIBUABLES)[number];

export const estBackOffice = (role: string | undefined): boolean =>
  role !== undefined && ROLES_BACK_OFFICE.includes(role);
