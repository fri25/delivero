-- CreateEnum
CREATE TYPE "ModeEmplettes" AS ENUM ('liste_libre', 'catalogue');

-- CreateEnum
CREATE TYPE "ModeFinancementEmplettes" AS ENUM ('mobile_money_anticipe', 'especes_livraison', 'avance_livreur');

-- CreateEnum
CREATE TYPE "PreferenceRemplacement" AS ENUM ('equivalent', 'appeler', 'ne_pas_acheter');

-- CreateEnum
CREATE TYPE "StatutArticleEmplette" AS ENUM ('en_attente', 'achete', 'indisponible', 'remplace');

-- CreateEnum
CREATE TYPE "StatutEmplettes" AS ENUM ('confirmee', 'achats_en_cours', 'validation_depassement', 'achats_termines', 'en_route', 'livree', 'litige', 'annulee');

-- CreateTable
CREATE TABLE "commandes_emplettes" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "mode" "ModeEmplettes" NOT NULL DEFAULT 'liste_libre',
    "lieu_achat" TEXT,
    "zone_id" TEXT NOT NULL,
    "budget_max" DECIMAL(12,2) NOT NULL,
    "montant_reel" DECIMAL(12,2),
    "mode_financement" "ModeFinancementEmplettes" NOT NULL,
    "recapitulatif_achats" TEXT,
    "statut" "StatutEmplettes" NOT NULL DEFAULT 'confirmee',
    "motif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_emplettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_emplettes" (
    "id" TEXT NOT NULL,
    "commande_emplettes_id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "preference_remplacement" "PreferenceRemplacement" NOT NULL DEFAULT 'ne_pas_acheter',
    "statut" "StatutArticleEmplette" NOT NULL DEFAULT 'en_attente',
    "prix_reel" DECIMAL(12,2),
    "produit_remplacement_libelle" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_emplettes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commandes_emplettes_commande_id_key" ON "commandes_emplettes"("commande_id");

-- AddForeignKey
ALTER TABLE "commandes_emplettes" ADD CONSTRAINT "commandes_emplettes_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_emplettes" ADD CONSTRAINT "commandes_emplettes_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles_emplettes" ADD CONSTRAINT "articles_emplettes_commande_emplettes_id_fkey" FOREIGN KEY ("commande_emplettes_id") REFERENCES "commandes_emplettes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
