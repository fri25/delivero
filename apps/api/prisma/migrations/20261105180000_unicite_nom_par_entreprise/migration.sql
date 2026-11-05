-- Étape 5 of docs/plan-migration-multi-tenant.md (contract of étape 2): the
-- name of a zone or a quartier is unique per company only, through
-- UNIQUE (tenant_id, nom) added at étape 2. Two companies of the same town
-- can both have "Centre-ville". The API looks names up within the company
-- of the request since étape 4.
-- Rollback: prisma/retour-arriere/20261105180000_unicite_nom_par_entreprise.sql.

-- DropIndex
DROP INDEX "quartiers_nom_key";

-- DropIndex
DROP INDEX "zones_nom_key";

