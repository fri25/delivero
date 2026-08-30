-- AlterTable
ALTER TABLE "mouvements_portefeuille" ADD COLUMN     "cloture_caisse_id" TEXT;

-- CreateTable
CREATE TABLE "clotures_caisse" (
    "id" TEXT NOT NULL,
    "livreur_id" TEXT NOT NULL,
    "montant_theorique" DECIMAL(12,2) NOT NULL,
    "montant_declare" DECIMAL(12,2) NOT NULL,
    "ecart" DECIMAL(12,2) NOT NULL,
    "rapprochee_at" TIMESTAMP(3),
    "rapprochee_par_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clotures_caisse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mouvements_portefeuille" ADD CONSTRAINT "mouvements_portefeuille_cloture_caisse_id_fkey" FOREIGN KEY ("cloture_caisse_id") REFERENCES "clotures_caisse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clotures_caisse" ADD CONSTRAINT "clotures_caisse_livreur_id_fkey" FOREIGN KEY ("livreur_id") REFERENCES "livreurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clotures_caisse" ADD CONSTRAINT "clotures_caisse_rapprochee_par_id_fkey" FOREIGN KEY ("rapprochee_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
