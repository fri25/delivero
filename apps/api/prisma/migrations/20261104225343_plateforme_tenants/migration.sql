-- CreateEnum
CREATE TYPE "StatutTenant" AS ENUM ('actif', 'suspendu', 'resilie');

-- CreateEnum
CREATE TYPE "StatutAbonnement" AS ENUM ('essai', 'actif', 'suspendu', 'termine');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "statut" "StatutTenant" NOT NULL DEFAULT 'actif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "domaine" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "verifie_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "tenant_id" TEXT NOT NULL,
    "nom_commercial" TEXT NOT NULL,
    "logo_url" TEXT,
    "couleur_primaire" TEXT NOT NULL,
    "couleur_marine" TEXT NOT NULL,
    "couleur_signal" TEXT NOT NULL,
    "telephone_contact" TEXT,
    "whatsapp_support" TEXT,
    "email_contact" TEXT,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "devise" TEXT NOT NULL,
    "fuseau_horaire" TEXT NOT NULL,
    "indicatif_telephone" TEXT NOT NULL,
    "taux_commission" DECIMAL(5,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_features" (
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenant_features_pkey" PRIMARY KEY ("tenant_id","code")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "statut" "StatutAbonnement" NOT NULL DEFAULT 'actif',
    "debut_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_secrets" (
    "tenant_id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur_chiffree" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_secrets_pkey" PRIMARY KEY ("tenant_id","cle")
);

-- CreateTable
CREATE TABLE "platform_admins" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "acteur_id" TEXT,
    "action" TEXT NOT NULL,
    "cible_type" TEXT,
    "cible_id" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_domaine_key" ON "tenant_domains"("domaine");

-- CreateIndex
CREATE INDEX "tenant_domains_tenant_id_idx" ON "tenant_domains"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_acteur_id_idx" ON "audit_logs"("acteur_id");

-- AddForeignKey
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_features" ADD CONSTRAINT "tenant_features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_secrets" ADD CONSTRAINT "tenant_secrets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CHAP EXPRESS, tenant n°1 (docs/plan-migration-multi-tenant.md, étape 1).
-- Fixed id: default value of the tenant_id columns of étape 2. Every value
-- below is what the application already applies today; none is a new rule.

INSERT INTO "tenants" ("id", "slug", "nom", "statut", "updated_at")
VALUES ('tnt_chapexpress', 'chapexpress', 'CHAP EXPRESS', 'actif', CURRENT_TIMESTAMP);

-- Current Render static sites (render.yaml). Not verified: Render adds a
-- suffix when a name is taken; the platform app (étape 9) corrects them.
-- Until étape 10 an unknown domain falls back on CHAP EXPRESS anyway.
INSERT INTO "tenant_domains" ("id", "domaine", "tenant_id", "principal") VALUES
  ('dom_chapexpress_client', 'chapexpress-client.onrender.com', 'tnt_chapexpress', true),
  ('dom_chapexpress_livreur', 'chapexpress-livreur.onrender.com', 'tnt_chapexpress', false),
  ('dom_chapexpress_partenaires', 'chapexpress-partenaires.onrender.com', 'tnt_chapexpress', false),
  ('dom_chapexpress_admin', 'chapexpress-admin.onrender.com', 'tnt_chapexpress', false);

-- Colours of packages/config/marque.css, support number of
-- apps/client/src/lib/support.ts, contact of VAPID_SUBJECT, commission of
-- commandes-repas.service.ts (15 %).
INSERT INTO "tenant_settings" (
  "tenant_id", "nom_commercial", "couleur_primaire", "couleur_marine", "couleur_signal",
  "telephone_contact", "whatsapp_support", "email_contact",
  "ville", "pays", "devise", "fuseau_horaire", "indicatif_telephone",
  "taux_commission", "updated_at"
) VALUES (
  'tnt_chapexpress', 'ChapExpress', '#1450d8', '#0a2a66', '#d7262e',
  '+2290157866959', '+2290157866959', 'contact@chapexpress.bj',
  'Natitingou', 'BJ', 'XOF', 'Africa/Porto-Novo', '+229',
  15.00, CURRENT_TIMESTAMP
);

-- V1 scope (packages/config/perimetre-v1.ts and the API defaults): three
-- services open, Mobile Money only, no cash on delivery.
INSERT INTO "tenant_features" ("tenant_id", "code", "actif") VALUES
  ('tnt_chapexpress', 'service.repas', true),
  ('tnt_chapexpress', 'service.colis', true),
  ('tnt_chapexpress', 'service.courses_express', true),
  ('tnt_chapexpress', 'service.emplettes', false),
  ('tnt_chapexpress', 'paiement.mobile_money', true),
  ('tnt_chapexpress', 'paiement.especes', false),
  ('tnt_chapexpress', 'colis.contre_remboursement', false);

-- No billing in the application (decision Q-MT-5).
INSERT INTO "plans" ("id", "code", "nom", "description") VALUES
  ('pln_pilote', 'pilote', 'Pilote', 'Partenaire de lancement, sans facturation dans l''application.');

INSERT INTO "subscriptions" ("id", "tenant_id", "plan_id", "statut") VALUES
  ('abo_chapexpress', 'tnt_chapexpress', 'pln_pilote', 'actif');
