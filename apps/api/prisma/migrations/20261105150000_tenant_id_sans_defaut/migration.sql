-- Étape 4 of docs/plan-migration-multi-tenant.md, second release.
-- The tenant_id default no longer puts rows in CHAP EXPRESS: it reads the
-- app.tenant_id setting, unset until RLS (étape 7). A write that escapes the
-- Prisma extension therefore fails (NOT NULL / unknown setting) instead of
-- landing silently in some company.
--
-- DEPLOY ONLY AFTER the step-4 API (commit "every request scoped to its
-- company") runs in production: the previous API version sets no tenant_id
-- and would fail on every insert during the switch-over.
-- Rollback: prisma/retour-arriere/20261105150000_tenant_id_sans_defaut.sql.

-- AlterTable
ALTER TABLE "abonnements_push" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "adresses" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "articles_emplettes" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "clotures_caisse" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "commandes" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "commandes_colis" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "commandes_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "commandes_emplettes" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "commandes_repas" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "etapes_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "grilles_tarifaires_colis" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "grilles_tarifaires_courses_express" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "lignes_commande_repas" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "livreurs" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "mouvements_portefeuille" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "notations" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "paiements" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "partenaires" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "plats" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "quartiers" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

-- AlterTable
ALTER TABLE "zones" ALTER COLUMN "tenant_id" SET DEFAULT current_setting('app.tenant_id'::text);

