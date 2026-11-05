-- Undoes migration 20261105180000_unicite_nom_par_entreprise: names unique
-- across all companies again. Fails on purpose if two companies already use
-- the same zone or quartier name: rolling back would then break their data.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261105180000_unicite_nom_par_entreprise.sql

BEGIN;

CREATE UNIQUE INDEX "zones_nom_key" ON "zones"("nom");
CREATE UNIQUE INDEX "quartiers_nom_key" ON "quartiers"("nom");

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261105180000_unicite_nom_par_entreprise';

COMMIT;
