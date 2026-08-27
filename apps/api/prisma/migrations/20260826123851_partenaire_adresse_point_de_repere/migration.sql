-- AlterTable
ALTER TABLE "partenaires" ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "point_de_repere" TEXT;
