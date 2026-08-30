-- CreateEnum
CREATE TYPE "TypeMouvementPortefeuille" AS ENUM ('avance', 'encaissement');

-- CreateTable
CREATE TABLE "mouvements_portefeuille" (
    "id" TEXT NOT NULL,
    "livreur_id" TEXT NOT NULL,
    "commande_id" TEXT,
    "type" "TypeMouvementPortefeuille" NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_portefeuille_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mouvements_portefeuille" ADD CONSTRAINT "mouvements_portefeuille_livreur_id_fkey" FOREIGN KEY ("livreur_id") REFERENCES "livreurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvements_portefeuille" ADD CONSTRAINT "mouvements_portefeuille_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
