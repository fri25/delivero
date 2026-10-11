-- AlterTable
ALTER TABLE "partenaires" ADD COLUMN "types_cuisine" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "delai_preparation_min" INTEGER;
