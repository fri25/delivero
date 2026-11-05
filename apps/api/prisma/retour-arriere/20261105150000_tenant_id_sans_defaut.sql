-- Undoes migration 20261105150000_tenant_id_sans_defaut: CHAP EXPRESS is the
-- default company again (as after étape 2). Needed before redeploying an
-- API older than étape 4:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261105150000_tenant_id_sans_defaut.sql

BEGIN;

ALTER TABLE "abonnements_push" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "adresses" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "articles_emplettes" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "clotures_caisse" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "commandes" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "commandes_colis" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "commandes_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "commandes_emplettes" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "commandes_repas" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "etapes_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "grilles_tarifaires_colis" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "grilles_tarifaires_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "lignes_commande_repas" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "livreurs" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "mouvements_portefeuille" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "notations" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "paiements" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "partenaires" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "plats" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "quartiers" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';
ALTER TABLE "zones" ALTER COLUMN "tenant_id" SET DEFAULT 'tnt_chapexpress';

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261105150000_tenant_id_sans_defaut';

COMMIT;
