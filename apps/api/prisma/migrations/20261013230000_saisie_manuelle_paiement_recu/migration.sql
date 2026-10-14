-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "saisie_par_id" TEXT;

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "confirme_at" TIMESTAMP(3),
ADD COLUMN     "confirme_par_id" TEXT,
ADD COLUMN     "reference_manuelle" TEXT;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_saisie_par_id_fkey" FOREIGN KEY ("saisie_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_confirme_par_id_fkey" FOREIGN KEY ("confirme_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

