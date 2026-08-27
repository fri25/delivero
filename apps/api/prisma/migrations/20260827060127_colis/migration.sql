-- CreateEnum
CREATE TYPE "TailleColis" AS ENUM ('petit', 'moyen', 'grand');

-- CreateEnum
CREATE TYPE "StatutColis" AS ENUM ('confirmee', 'livreur_en_route_enlevement', 'colis_recupere', 'en_route', 'livre', 'litige', 'annulee');

-- CreateTable
CREATE TABLE "grilles_tarifaires_colis" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "tarif_base" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grilles_tarifaires_colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_colis" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "adresse_enlevement_id" TEXT NOT NULL,
    "destinataire_nom" TEXT NOT NULL,
    "destinataire_telephone" TEXT NOT NULL,
    "adresse_livraison" TEXT NOT NULL,
    "point_de_repere_livraison" TEXT NOT NULL,
    "latitude_livraison" DECIMAL(10,7),
    "longitude_livraison" DECIMAL(10,7),
    "zone_id" TEXT NOT NULL,
    "taille" "TailleColis" NOT NULL,
    "valeur_declaree" DECIMAL(12,2),
    "fragile" BOOLEAN NOT NULL DEFAULT false,
    "montant_contre_remboursement" DECIMAL(12,2),
    "montant_encaisse" DECIMAL(12,2),
    "conditions_acceptees" BOOLEAN NOT NULL DEFAULT false,
    "programmation_at" TIMESTAMP(3),
    "code_otp" TEXT NOT NULL,
    "nom_receptionnaire" TEXT,
    "statut" "StatutColis" NOT NULL DEFAULT 'confirmee',
    "motif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_colis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grilles_tarifaires_colis_zone_id_key" ON "grilles_tarifaires_colis"("zone_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_colis_commande_id_key" ON "commandes_colis"("commande_id");

-- AddForeignKey
ALTER TABLE "grilles_tarifaires_colis" ADD CONSTRAINT "grilles_tarifaires_colis_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_colis" ADD CONSTRAINT "commandes_colis_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_colis" ADD CONSTRAINT "commandes_colis_adresse_enlevement_id_fkey" FOREIGN KEY ("adresse_enlevement_id") REFERENCES "adresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_colis" ADD CONSTRAINT "commandes_colis_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
