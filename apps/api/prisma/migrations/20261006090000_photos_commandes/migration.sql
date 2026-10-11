-- AlterTable
ALTER TABLE "commandes_colis" ADD COLUMN "photo_url" TEXT;

-- AlterTable
ALTER TABLE "commandes_courses_express" ADD COLUMN "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
