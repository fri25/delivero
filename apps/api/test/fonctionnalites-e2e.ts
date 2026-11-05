import 'dotenv/config';
import { Client } from 'pg';

// The e2e suites check the full implementation (cash, Emplettes, cash on
// delivery), which V1 closes. setup-e2e.ts opens the platform ceiling
// (environment); since étape 5 the company's features must be open too
// (docs/plan-migration-multi-tenant.md). Opened for the run, then restored:
// a local database keeps its own values.
const CHAP_EXPRESS = 'tnt_chapexpress';

interface Etat {
  code: string;
  actif: boolean;
}

declare global {
  var __fonctionnalitesAvantE2e: Etat[] | undefined;
}

async function avecBase<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function ouvrir() {
  await avecBase(async (client) => {
    const { rows } = await client.query<Etat>(
      'SELECT code, actif FROM tenant_features WHERE tenant_id = $1',
      [CHAP_EXPRESS],
    );
    globalThis.__fonctionnalitesAvantE2e = rows;
    await client.query(
      'UPDATE tenant_features SET actif = true WHERE tenant_id = $1',
      [CHAP_EXPRESS],
    );
  });
}

export async function restaurer() {
  const avant = globalThis.__fonctionnalitesAvantE2e ?? [];
  await avecBase(async (client) => {
    for (const { code, actif } of avant) {
      await client.query(
        'UPDATE tenant_features SET actif = $3 WHERE tenant_id = $1 AND code = $2',
        [CHAP_EXPRESS, code, actif],
      );
    }
  });
}
