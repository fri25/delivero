-- Étape 2 of docs/plan-migration-multi-tenant.md: every business table gets
-- tenant_id. The constant default makes PostgreSQL (>= 11) add the column
-- without rewriting the table: every existing row belongs to CHAP EXPRESS
-- at once, and the previous API version, which does not know tenant_id,
-- keeps inserting rows that do too. The default goes away at étape 4.
-- Expand only: the old UNIQUE (nom) on zones and quartiers stays until
-- étape 5, next to the new UNIQUE (tenant_id, nom). Rollback:
-- prisma/retour-arriere/20261105090000_tenant_id_metier.sql.

-- AlterTable
ALTER TABLE "abonnements_push" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "adresses" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "articles_emplettes" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "clotures_caisse" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "commandes_colis" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "commandes_courses_express" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "commandes_emplettes" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "commandes_repas" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "etapes_courses_express" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "grilles_tarifaires_colis" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "grilles_tarifaires_courses_express" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "lignes_commande_repas" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "livreurs" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "mouvements_portefeuille" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "notations" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "partenaires" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "plats" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "quartiers" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'tnt_chapexpress';

-- CreateIndex
CREATE INDEX "abonnements_push_tenant_id_idx" ON "abonnements_push"("tenant_id");

-- CreateIndex
CREATE INDEX "adresses_tenant_id_idx" ON "adresses"("tenant_id");

-- CreateIndex
CREATE INDEX "articles_emplettes_tenant_id_idx" ON "articles_emplettes"("tenant_id");

-- CreateIndex
CREATE INDEX "clotures_caisse_tenant_id_idx" ON "clotures_caisse"("tenant_id");

-- CreateIndex
CREATE INDEX "commandes_tenant_id_idx" ON "commandes"("tenant_id");

-- CreateIndex
CREATE INDEX "commandes_tenant_id_created_at_idx" ON "commandes"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "commandes_tenant_id_livreur_id_idx" ON "commandes"("tenant_id", "livreur_id");

-- CreateIndex
CREATE INDEX "commandes_colis_tenant_id_idx" ON "commandes_colis"("tenant_id");

-- CreateIndex
CREATE INDEX "commandes_courses_express_tenant_id_idx" ON "commandes_courses_express"("tenant_id");

-- CreateIndex
CREATE INDEX "commandes_emplettes_tenant_id_idx" ON "commandes_emplettes"("tenant_id");

-- CreateIndex
CREATE INDEX "commandes_repas_tenant_id_idx" ON "commandes_repas"("tenant_id");

-- CreateIndex
CREATE INDEX "etapes_courses_express_tenant_id_idx" ON "etapes_courses_express"("tenant_id");

-- CreateIndex
CREATE INDEX "grilles_tarifaires_colis_tenant_id_idx" ON "grilles_tarifaires_colis"("tenant_id");

-- CreateIndex
CREATE INDEX "grilles_tarifaires_courses_express_tenant_id_idx" ON "grilles_tarifaires_courses_express"("tenant_id");

-- CreateIndex
CREATE INDEX "lignes_commande_repas_tenant_id_idx" ON "lignes_commande_repas"("tenant_id");

-- CreateIndex
CREATE INDEX "livreurs_tenant_id_idx" ON "livreurs"("tenant_id");

-- CreateIndex
CREATE INDEX "livreurs_tenant_id_disponible_idx" ON "livreurs"("tenant_id", "disponible");

-- CreateIndex
CREATE INDEX "mouvements_portefeuille_tenant_id_idx" ON "mouvements_portefeuille"("tenant_id");

-- CreateIndex
CREATE INDEX "notations_tenant_id_idx" ON "notations"("tenant_id");

-- CreateIndex
CREATE INDEX "paiements_tenant_id_idx" ON "paiements"("tenant_id");

-- CreateIndex
CREATE INDEX "partenaires_tenant_id_idx" ON "partenaires"("tenant_id");

-- CreateIndex
CREATE INDEX "plats_tenant_id_idx" ON "plats"("tenant_id");

-- CreateIndex
CREATE INDEX "quartiers_tenant_id_idx" ON "quartiers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quartiers_tenant_id_nom_key" ON "quartiers"("tenant_id", "nom");

-- CreateIndex
CREATE INDEX "zones_tenant_id_idx" ON "zones"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "zones_tenant_id_nom_key" ON "zones"("tenant_id", "nom");

-- AddForeignKey
ALTER TABLE "notations" ADD CONSTRAINT "notations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_push" ADD CONSTRAINT "abonnements_push_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quartiers" ADD CONSTRAINT "quartiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partenaires" ADD CONSTRAINT "partenaires_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livreurs" ADD CONSTRAINT "livreurs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_portefeuille" ADD CONSTRAINT "mouvements_portefeuille_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clotures_caisse" ADD CONSTRAINT "clotures_caisse_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plats" ADD CONSTRAINT "plats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_repas" ADD CONSTRAINT "commandes_repas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande_repas" ADD CONSTRAINT "lignes_commande_repas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grilles_tarifaires_colis" ADD CONSTRAINT "grilles_tarifaires_colis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_colis" ADD CONSTRAINT "commandes_colis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_emplettes" ADD CONSTRAINT "commandes_emplettes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_emplettes" ADD CONSTRAINT "articles_emplettes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grilles_tarifaires_courses_express" ADD CONSTRAINT "grilles_tarifaires_courses_express_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_courses_express" ADD CONSTRAINT "commandes_courses_express_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapes_courses_express" ADD CONSTRAINT "etapes_courses_express_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

