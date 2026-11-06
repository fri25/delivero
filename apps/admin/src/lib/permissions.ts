import { useAuthStore } from '@/stores/auth-store';

/**
 * Back-office roles (étape 8 of docs/plan-migration-multi-tenant.md,
 * apps/api/src/auth/roles.ts). admin_dispatcher is the former name of
 * admin_entreprise and opens the same screens.
 */
export const ROLES_BACK_OFFICE = ['admin_entreprise', 'gestionnaire', 'admin_dispatcher'];

export const LIBELLES_ROLES: Record<string, string> = {
  admin_entreprise: 'Administrateur',
  admin_dispatcher: 'Administrateur',
  gestionnaire: 'Gestionnaire',
};

/**
 * What the signed-in account may do, from the permissions of its profile.
 * A session saved before étape 8 has none: it can only be an
 * admin_dispatcher, which holds them all (RootLayout refreshes it).
 */
export function usePeut(): (permission: string) => boolean {
  const permissions = useAuthStore((state) => state.user?.permissions);
  return (permission) => permissions === undefined || permissions.includes(permission);
}
