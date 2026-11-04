-- Undoes migration 20261104225343_plateforme_tenants (étape 1 of
-- docs/plan-migration-multi-tenant.md). Prisma has no down migrations: each
-- step of the multi-tenant plan ships its inverse in this folder.
--
-- Safe only while no later migration of the plan is applied (étape 2 adds
-- tenant_id columns that reference "tenants"). Then:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261104225343_plateforme_tenants.sql
-- and redeploy the API version that precedes the migration.

BEGIN;

DROP TABLE IF EXISTS "audit_logs";
DROP TABLE IF EXISTS "platform_admins";
DROP TABLE IF EXISTS "tenant_secrets";
DROP TABLE IF EXISTS "subscriptions";
DROP TABLE IF EXISTS "plans";
DROP TABLE IF EXISTS "tenant_features";
DROP TABLE IF EXISTS "tenant_settings";
DROP TABLE IF EXISTS "tenant_domains";
DROP TABLE IF EXISTS "tenants";
DROP TYPE IF EXISTS "StatutAbonnement";
DROP TYPE IF EXISTS "StatutTenant";

-- Lets `prisma migrate deploy` apply the migration again later.
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261104225343_plateforme_tenants';

COMMIT;
