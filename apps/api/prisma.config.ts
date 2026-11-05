import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Migrations run as the owner of the tables. In production the API connects
// with a restricted role subject to row-level security (étape 7 of
// docs/plan-migration-multi-tenant.md): DATABASE_URL_MIGRATIONS then carries
// the owner's URL. Without it, migrations use DATABASE_URL as before.
const url = process.env.DATABASE_URL_MIGRATIONS || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL manquant');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: { url },
});
