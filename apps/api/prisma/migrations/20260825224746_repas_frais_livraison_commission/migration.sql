-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "commission" DECIMAL(12,2),
ADD COLUMN     "frais_livraison" DECIMAL(12,2),
ADD COLUMN     "sous_total" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "frais_livraison" DECIMAL(10,2) NOT NULL DEFAULT 500;
