import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { TENANT_PAR_DEFAUT } from '../src/auth/appartenance';
import { extensionTenant } from '../src/prisma/extension-tenant';
import { creerPoolTenant } from '../src/prisma/pool-tenant';
import { executerDansTenant } from '../src/tenancy/contexte-tenant';

/**
 * Prisma client of the scripts (seed, bootstrap-admin) with the same company
 * filter as the API (étape 4 of docs/plan-migration-multi-tenant.md): rows
 * they create, nested ones included, get their company explicitly instead
 * of relying on a column default.
 */
export function clientScript(): PrismaClient {
  const adapter = new PrismaPg(
    creerPoolTenant({ connectionString: process.env.DATABASE_URL }),
  );
  return new PrismaClient({ adapter }).$extends(
    extensionTenant,
  ) as unknown as PrismaClient;
}

/** Runs a script for CHAP EXPRESS, the only company the scripts seed. */
export function pourChapExpress<T>(main: () => Promise<T>): Promise<T> {
  return executerDansTenant(TENANT_PAR_DEFAUT, main);
}
