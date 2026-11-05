-- Undoes migration 20261106100000_rls_isolation_entreprise: the Prisma
-- extension stays the only barrier. Data is not touched.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261106100000_rls_isolation_entreprise.sql

BEGIN;

DROP POLICY IF EXISTS "isolation_entreprise" ON "abonnements_push";
ALTER TABLE "abonnements_push" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "abonnements_push" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "adresses";
ALTER TABLE "adresses" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "adresses" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "articles_emplettes";
ALTER TABLE "articles_emplettes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "articles_emplettes" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "clotures_caisse";
ALTER TABLE "clotures_caisse" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "clotures_caisse" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "commandes";
ALTER TABLE "commandes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "commandes" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "commandes_colis";
ALTER TABLE "commandes_colis" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "commandes_colis" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "commandes_courses_express";
ALTER TABLE "commandes_courses_express" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "commandes_courses_express" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "commandes_emplettes";
ALTER TABLE "commandes_emplettes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "commandes_emplettes" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "commandes_repas";
ALTER TABLE "commandes_repas" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "commandes_repas" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "etapes_courses_express";
ALTER TABLE "etapes_courses_express" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "etapes_courses_express" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "grilles_tarifaires_colis";
ALTER TABLE "grilles_tarifaires_colis" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "grilles_tarifaires_colis" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "grilles_tarifaires_courses_express";
ALTER TABLE "grilles_tarifaires_courses_express" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "grilles_tarifaires_courses_express" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "lignes_commande_repas";
ALTER TABLE "lignes_commande_repas" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "lignes_commande_repas" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "livreurs";
ALTER TABLE "livreurs" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "livreurs" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "memberships";
ALTER TABLE "memberships" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "memberships" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "mouvements_portefeuille";
ALTER TABLE "mouvements_portefeuille" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "mouvements_portefeuille" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "notations";
ALTER TABLE "notations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "notations" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "paiements";
ALTER TABLE "paiements" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "paiements" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "partenaires";
ALTER TABLE "partenaires" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "partenaires" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "plats";
ALTER TABLE "plats" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "plats" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "quartiers";
ALTER TABLE "quartiers" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "quartiers" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "isolation_entreprise" ON "zones";
ALTER TABLE "zones" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE "zones" DISABLE ROW LEVEL SECURITY;

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261106100000_rls_isolation_entreprise';

COMMIT;
