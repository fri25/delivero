/*
  Warnings:

  - You are about to drop the column `statut` on the `commandes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StatutRepas" AS ENUM ('en_attente_acceptation', 'confirmee', 'refusee', 'en_preparation', 'prete', 'recuperee_par_livreur', 'en_route', 'livree', 'annulee');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('mobile_money', 'especes');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('en_attente', 'reussi', 'echoue', 'a_percevoir_livraison');

-- AlterTable
ALTER TABLE "commandes" DROP COLUMN "statut";

-- AlterTable
ALTER TABLE "partenaires" ADD COLUMN     "description" TEXT,
ADD COLUMN     "horaires" TEXT,
ADD COLUMN     "note_moyenne" DECIMAL(3,2);

-- CreateTable
CREATE TABLE "plats" (
    "id" TEXT NOT NULL,
    "partenaire_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "description" TEXT,
    "prix" DECIMAL(10,2) NOT NULL,
    "photo_url" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_repas" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "partenaire_id" TEXT NOT NULL,
    "statut" "StatutRepas" NOT NULL DEFAULT 'en_attente_acceptation',
    "motif_refus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_repas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_commande_repas" (
    "id" TEXT NOT NULL,
    "commande_repas_id" TEXT NOT NULL,
    "plat_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(10,2) NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "lignes_commande_repas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "mode" "ModePaiement" NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'en_attente',
    "reference_transaction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commandes_repas_commande_id_key" ON "commandes_repas"("commande_id");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_commande_id_key" ON "paiements"("commande_id");

-- AddForeignKey
ALTER TABLE "plats" ADD CONSTRAINT "plats_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_repas" ADD CONSTRAINT "commandes_repas_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_repas" ADD CONSTRAINT "commandes_repas_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande_repas" ADD CONSTRAINT "lignes_commande_repas_commande_repas_id_fkey" FOREIGN KEY ("commande_repas_id") REFERENCES "commandes_repas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_commande_repas" ADD CONSTRAINT "lignes_commande_repas_plat_id_fkey" FOREIGN KEY ("plat_id") REFERENCES "plats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
