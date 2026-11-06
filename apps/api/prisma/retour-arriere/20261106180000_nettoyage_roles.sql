-- Undoes migration 20261106180000_nettoyage_roles. Accounts created since
-- have no users.role_id: they get the role of a membership (CHAP EXPRESS
-- first), else client, so that the column can be required again.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/retour-arriere/20261106180000_nettoyage_roles.sql

BEGIN;

SELECT set_config('app.plateforme', 'on', true);

-- Only CHAP EXPRESS had admin_dispatcher; both roles carry the same
-- permissions, so moving its admin_entreprise back is harmless.
UPDATE "memberships"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'admin_dispatcher')
WHERE "tenant_id" = 'tnt_chapexpress'
  AND "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'admin_entreprise');

UPDATE "users" u SET "role_id" = (
  SELECT m."role_id" FROM "memberships" m WHERE m."user_id" = u."id"
  ORDER BY (m."tenant_id" = 'tnt_chapexpress') DESC, m."created_at" LIMIT 1
)
WHERE u."role_id" IS NULL;
UPDATE "users" SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'client')
WHERE "role_id" IS NULL;

ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20261106180000_nettoyage_roles';

COMMIT;
