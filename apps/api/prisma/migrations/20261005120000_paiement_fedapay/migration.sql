-- AlterEnum
ALTER TYPE "StatutPaiement" ADD VALUE 'a_rembourser';
ALTER TYPE "StatutPaiement" ADD VALUE 'rembourse';

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_transaction_key" ON "paiements"("reference_transaction");
