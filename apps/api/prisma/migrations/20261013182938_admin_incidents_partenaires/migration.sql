-- AlterTable
ALTER TABLE "commandes" ADD COLUMN     "annulee_at" TIMESTAMP(3),
ADD COLUMN     "annulee_par_id" TEXT,
ADD COLUMN     "motif_annulation" TEXT;

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "montant_rembourse" DECIMAL(12,2),
ADD COLUMN     "motif_remboursement" TEXT,
ADD COLUMN     "reference_remboursement" TEXT,
ADD COLUMN     "rembourse_at" TIMESTAMP(3),
ADD COLUMN     "rembourse_par_id" TEXT;

-- AlterTable
ALTER TABLE "partenaires" ADD COLUMN     "suspendu" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_annulee_par_id_fkey" FOREIGN KEY ("annulee_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_rembourse_par_id_fkey" FOREIGN KEY ("rembourse_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
