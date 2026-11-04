-- Undoes migration 20261105090000_tenant_id_metier (étape 2 of
-- docs/plan-migration-multi-tenant.md). Dropping a column drops its index,
-- its foreign key and the composite uniques with it. Safe while étape 4 is
-- not deployed (no code reads tenant_id before it):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261105090000_tenant_id_metier.sql

BEGIN;

ALTER TABLE "abonnements_push" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "adresses" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "articles_emplettes" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "clotures_caisse" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "commandes" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "commandes_colis" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "commandes_courses_express" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "commandes_emplettes" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "commandes_repas" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "etapes_courses_express" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "grilles_tarifaires_colis" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "grilles_tarifaires_courses_express" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "lignes_commande_repas" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "livreurs" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "mouvements_portefeuille" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "notations" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "paiements" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "partenaires" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "plats" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "quartiers" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "zones" DROP COLUMN IF EXISTS "tenant_id";

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261105090000_tenant_id_metier';

COMMIT;
