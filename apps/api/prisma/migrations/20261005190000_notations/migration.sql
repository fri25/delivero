-- CreateEnum
CREATE TYPE "CibleNotation" AS ENUM ('partenaire', 'livreur');

-- CreateTable
CREATE TABLE "notations" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "cible" "CibleNotation" NOT NULL,
    "partenaire_id" TEXT,
    "livreur_id" TEXT,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notations_commande_id_cible_key" ON "notations"("commande_id", "cible");

-- CreateIndex
CREATE INDEX "notations_partenaire_id_idx" ON "notations"("partenaire_id");

-- CreateIndex
CREATE INDEX "notations_livreur_id_idx" ON "notations"("livreur_id");

-- AddForeignKey
ALTER TABLE "notations" ADD CONSTRAINT "notations_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notations" ADD CONSTRAINT "notations_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notations" ADD CONSTRAINT "notations_livreur_id_fkey" FOREIGN KEY ("livreur_id") REFERENCES "livreurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rating range enforced in the database as well as in the DTO.
ALTER TABLE "notations" ADD CONSTRAINT "notations_note_check" CHECK ("note" BETWEEN 1 AND 5);
