import { Client } from 'pg';

// Role the API uses during the e2e run (étape 7): no SUPERUSER, no
// BYPASSRLS, so the row-level security policies apply as in production.
export const ROLE_APPLICATION_E2E = 'rapidliv_app_e2e';

export function urlRoleApplication(urlProprietaire: string): string {
  const url = new URL(urlProprietaire);
  url.username = ROLE_APPLICATION_E2E;
  url.password = ROLE_APPLICATION_E2E;
  return url.toString();
}

/** Creates the role if needed and grants it what the API needs, no more. */
export async function preparerRoleApplication(urlProprietaire: string) {
  const client = new Client({ connectionString: urlProprietaire });
  await client.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${ROLE_APPLICATION_E2E}') THEN
          CREATE ROLE ${ROLE_APPLICATION_E2E} LOGIN PASSWORD '${ROLE_APPLICATION_E2E}'
            NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        END IF;
      END $$`);
    await client.query(
      `GRANT USAGE ON SCHEMA public TO ${ROLE_APPLICATION_E2E}`,
    );
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ROLE_APPLICATION_E2E}`,
    );
    await client.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${ROLE_APPLICATION_E2E}`,
    );
  } finally {
    await client.end();
  }
}
