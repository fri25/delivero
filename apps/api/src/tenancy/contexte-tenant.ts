import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Company of the code being run (étape 4 of docs/plan-migration-multi-tenant.md).
 * Filled by TenantMiddleware for each HTTP request, and explicitly by the
 * background tasks and the webhook. The Prisma extension reads it to scope
 * every query of a business model.
 */
export interface ContexteTenant {
  tenantId: string | null;
  /** Platform code (webhook lookup, background scans): no company filter. */
  plateforme: boolean;
}

const stockage = new AsyncLocalStorage<ContexteTenant>();

// Prisma queries are lazy: they start when awaited. Awaiting inside run()
// keeps the context; returning the query and awaiting it outside would run
// it without any company (and the extension would then throw).
export function executerDansTenant<T>(
  tenantId: string,
  fn: () => T | PromiseLike<T>,
): Promise<T> {
  return stockage.run({ tenantId, plateforme: false }, async () => await fn());
}

/**
 * Runs code that legitimately reads across companies. Kept rare and named:
 * every caller is a place where isolation is handled by hand.
 */
export function executerEnPlateforme<T>(
  fn: () => T | PromiseLike<T>,
): Promise<T> {
  return stockage.run(
    { tenantId: null, plateforme: true },
    async () => await fn(),
  );
}

/**
 * Synchronous binding for TenantMiddleware: what `next()` starts (guards,
 * controller, their awaits) runs in the company of the request.
 */
export function lierAuTenant(tenantId: string, suite: () => void): void {
  stockage.run({ tenantId, plateforme: false }, suite);
}

export function contexteTenant(): ContexteTenant | undefined {
  return stockage.getStore();
}

/** Company of the current request; throws when there is none. */
export function tenantCourant(): string {
  const tenantId = stockage.getStore()?.tenantId;
  if (!tenantId) {
    throw new Error('Aucune entreprise dans le contexte courant.');
  }
  return tenantId;
}
