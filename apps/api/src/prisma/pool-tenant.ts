import { Pool, type PoolClient, type PoolConfig } from 'pg';
import { contexteTenant } from '../tenancy/contexte-tenant';

/**
 * Connection pool that tells PostgreSQL which company a connection works for
 * (étape 7 of docs/plan-migration-multi-tenant.md). Each time a connection is
 * handed out, the session settings `app.tenant_id` and `app.plateforme` are
 * set from the context of the caller; the row-level security policies read
 * them. Even a query the Prisma extension misses (raw SQL, a bug) only sees
 * the company of its request.
 *
 * The context is captured when the caller asks for a connection, never when
 * the pool delivers it: a connection freed by another request must not
 * carry that request's company.
 */
type Reglage = { tenantId: string; plateforme: 'on' | 'off' };

const CLE = Symbol('reglageTenant');
type ClientRegle = PoolClient & { [CLE]?: string };

function reglageCourant(): Reglage {
  const contexte = contexteTenant();
  return {
    tenantId: contexte?.tenantId ?? '',
    plateforme: contexte?.plateforme ? 'on' : 'off',
  };
}

async function appliquer(client: ClientRegle, reglage: Reglage) {
  const cle = `${reglage.tenantId}|${reglage.plateforme}`;
  if (client[CLE] === cle) return;
  // Session-level (false): the connection keeps it until its next hand-out.
  await client.query(
    "SELECT set_config('app.tenant_id', $1, false), set_config('app.plateforme', $2, false)",
    [reglage.tenantId, reglage.plateforme],
  );
  client[CLE] = cle;
}

export function creerPoolTenant(config: PoolConfig): Pool {
  const pool = new Pool(config);
  const connecter = pool.connect.bind(pool) as () => Promise<PoolClient>;

  // Transactions: one connection for the whole transaction.
  const connect = async () => {
    const reglage = reglageCourant();
    const client = await connecter();
    try {
      await appliquer(client, reglage);
    } catch (error) {
      client.release(error as Error);
      throw error;
    }
    return client;
  };

  // Single statements: same, through a short checkout.
  const query = async (...args: unknown[]) => {
    const client = await connect();
    try {
      return await (client.query as (...a: unknown[]) => Promise<unknown>)(
        ...args,
      );
    } finally {
      client.release();
    }
  };

  return Object.assign(pool, { connect, query });
}
