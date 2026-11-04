-- Undoes migration 20261104233003_appartenances (étape 3 of
-- docs/plan-migration-multi-tenant.md). Safe at any time during étape 3:
-- users.role_id is still written by the API, so nothing is lost. Redeploy the
-- API version that precedes étape 3 first (it does not read memberships), then:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261104233003_appartenances.sql

BEGIN;

DROP TABLE IF EXISTS "memberships";
DROP TYPE IF EXISTS "StatutMembership";

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261104233003_appartenances';

COMMIT;
