CREATE TABLE "avis_partenaires" (
  "id" TEXT NOT NULL,
  "commande_id" TEXT NOT NULL,
  "partenaire_id" TEXT NOT NULL,
  "note" INTEGER NOT NULL,
  "commentaire" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "avis_partenaires_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "avis_livreurs" (
  "id" TEXT NOT NULL,
  "commande_id" TEXT NOT NULL,
  "livreur_id" TEXT NOT NULL,
  "note" INTEGER NOT NULL,
  "commentaire" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "avis_livreurs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "partenaires"
  ADD COLUMN "specialite_cuisine" TEXT,
  ADD COLUMN "delai_moyen_minutes" INTEGER;

CREATE UNIQUE INDEX "avis_partenaires_commande_id_key" ON "avis_partenaires"("commande_id");
CREATE INDEX "avis_partenaires_partenaire_id_created_at_idx" ON "avis_partenaires"("partenaire_id", "created_at");
CREATE UNIQUE INDEX "avis_livreurs_commande_id_key" ON "avis_livreurs"("commande_id");
CREATE INDEX "avis_livreurs_livreur_id_created_at_idx" ON "avis_livreurs"("livreur_id", "created_at");

ALTER TABLE "avis_partenaires" ADD CONSTRAINT "avis_partenaires_commande_id_fkey"
  FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "avis_partenaires" ADD CONSTRAINT "avis_partenaires_partenaire_id_fkey"
  FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "avis_livreurs" ADD CONSTRAINT "avis_livreurs_commande_id_fkey"
  FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "avis_livreurs" ADD CONSTRAINT "avis_livreurs_livreur_id_fkey"
  FOREIGN KEY ("livreur_id") REFERENCES "livreurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
