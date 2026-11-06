-- Undoes migration 20261106140000_roles_entreprise. Refused while an account
-- still holds admin_entreprise or gestionnaire (move it back to
-- admin_dispatcher first): the foreign key of memberships.role_id stops it.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261106140000_roles_entreprise.sql

BEGIN;

DELETE FROM "roles" WHERE "name" IN ('admin_entreprise', 'gestionnaire');
-- Cascades to role_permissions, admin_dispatcher's new links included.
DELETE FROM "permissions" WHERE "code" IN ('paiements.rembourser', 'entreprise.parametres', 'entreprise.utilisateurs', 'journal.consulter', 'clients.consulter');

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261106140000_roles_entreprise';

COMMIT;
