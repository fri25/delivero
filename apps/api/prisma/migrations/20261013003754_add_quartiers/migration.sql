-- AlterTable
ALTER TABLE "adresses" ADD COLUMN     "quartier_id" TEXT;

-- AlterTable
ALTER TABLE "commandes_colis" ADD COLUMN     "quartier_livraison_id" TEXT;

-- AlterTable
ALTER TABLE "etapes_courses_express" ADD COLUMN     "quartier_id" TEXT;

-- CreateTable
CREATE TABLE "quartiers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "frais_livraison" DECIMAL(10,2) NOT NULL,
    "autre" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quartiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quartiers_nom_key" ON "quartiers"("nom");

-- AddForeignKey
ALTER TABLE "adresses" ADD CONSTRAINT "adresses_quartier_id_fkey" FOREIGN KEY ("quartier_id") REFERENCES "quartiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_colis" ADD CONSTRAINT "commandes_colis_quartier_livraison_id_fkey" FOREIGN KEY ("quartier_livraison_id") REFERENCES "quartiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapes_courses_express" ADD CONSTRAINT "etapes_courses_express_quartier_id_fkey" FOREIGN KEY ("quartier_id") REFERENCES "quartiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Only one catch-all "Autre quartier" entry.
CREATE UNIQUE INDEX "quartiers_un_seul_autre" ON "quartiers"("autre") WHERE "autre";

-- Starting list given by ChapExpress on 13/10/2026 (Q-28): centre at
-- 500 FCFA, further out at 1 000 FCFA, any other neighbourhood at 1 000 FCFA.
-- Completed afterwards from the back-office (Quartiers page).
INSERT INTO "quartiers" ("id", "nom", "frais_livraison", "autre", "updated_at") VALUES
  (gen_random_uuid()::text, 'Boriyouré', 500, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Dassagate', 500, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Kantaborifa', 500, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Ourbouga', 1000, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sorssouna', 1000, false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Autre quartier', 1000, true, CURRENT_TIMESTAMP);
