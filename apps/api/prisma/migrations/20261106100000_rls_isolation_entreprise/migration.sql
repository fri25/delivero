-- Étape 7 of docs/plan-migration-multi-tenant.md: row-level security, the
-- second barrier behind the Prisma extension. Each connection of the API
-- carries the company of its request in app.tenant_id (src/prisma/
-- pool-tenant.ts); a policy only shows and accepts rows of that company.
-- app.plateforme = 'on' is the platform mode (webhook lookup, background
-- scans, super-admin), set only by executerEnPlateforme().
--
-- FORCE: the table owner is subject to the policies too. A SUPERUSER or a
-- role with BYPASSRLS still skips them: in production the API must connect
-- with a role that has neither (docs/deploiement.md § 8); migrations keep
-- running with the owner role. Rollback:
-- prisma/retour-arriere/20261106100000_rls_isolation_entreprise.sql.

ALTER TABLE "abonnements_push" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "abonnements_push" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "abonnements_push"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "adresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "adresses" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "adresses"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "articles_emplettes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "articles_emplettes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "articles_emplettes"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "clotures_caisse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clotures_caisse" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "clotures_caisse"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "commandes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "commandes"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "commandes_colis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes_colis" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "commandes_colis"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "commandes_courses_express" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes_courses_express" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "commandes_courses_express"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "commandes_emplettes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes_emplettes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "commandes_emplettes"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "commandes_repas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes_repas" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "commandes_repas"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "etapes_courses_express" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "etapes_courses_express" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "etapes_courses_express"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "grilles_tarifaires_colis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "grilles_tarifaires_colis" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "grilles_tarifaires_colis"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "grilles_tarifaires_courses_express" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "grilles_tarifaires_courses_express" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "grilles_tarifaires_courses_express"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "lignes_commande_repas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lignes_commande_repas" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "lignes_commande_repas"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "livreurs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "livreurs" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "livreurs"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "memberships"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "mouvements_portefeuille" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mouvements_portefeuille" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "mouvements_portefeuille"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "notations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "notations"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "paiements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "paiements" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "paiements"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "partenaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partenaires" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "partenaires"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "plats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plats" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "plats"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "quartiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quartiers" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "quartiers"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

ALTER TABLE "zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "zones" FORCE ROW LEVEL SECURITY;
CREATE POLICY "isolation_entreprise" ON "zones"
  USING (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true))
  WITH CHECK (current_setting('app.plateforme', true) = 'on' OR "tenant_id" = current_setting('app.tenant_id', true));

