-- CreateEnum
CREATE TYPE "StatutCoursesExpress" AS ENUM ('confirmee', 'en_cours', 'etape_realisee', 'terminee', 'litige', 'annulee');

-- CreateTable
CREATE TABLE "grilles_tarifaires_courses_express" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "tarif_base" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grilles_tarifaires_courses_express_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_courses_express" (
    "id" TEXT NOT NULL,
    "commande_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "statut" "StatutCoursesExpress" NOT NULL DEFAULT 'confirmee',
    "motif" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_courses_express_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapes_courses_express" (
    "id" TEXT NOT NULL,
    "commande_courses_express_id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "adresse" TEXT,
    "point_de_repere" TEXT NOT NULL,
    "realisee" BOOLEAN NOT NULL DEFAULT false,
    "realisee_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etapes_courses_express_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grilles_tarifaires_courses_express_zone_id_key" ON "grilles_tarifaires_courses_express"("zone_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_courses_express_commande_id_key" ON "commandes_courses_express"("commande_id");

-- AddForeignKey
ALTER TABLE "grilles_tarifaires_courses_express" ADD CONSTRAINT "grilles_tarifaires_courses_express_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_courses_express" ADD CONSTRAINT "commandes_courses_express_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_courses_express" ADD CONSTRAINT "commandes_courses_express_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapes_courses_express" ADD CONSTRAINT "etapes_courses_express_commande_courses_express_id_fkey" FOREIGN KEY ("commande_courses_express_id") REFERENCES "commandes_courses_express"("id") ON DELETE CASCADE ON UPDATE CASCADE;
