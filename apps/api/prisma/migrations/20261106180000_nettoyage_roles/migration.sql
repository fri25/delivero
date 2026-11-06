-- Étape 10 of docs/plan-migration-multi-tenant.md, role clean-up.
-- 1. The admin_dispatcher memberships become admin_entreprise (same
--    permissions since migration 20261106140000_roles_entreprise: nobody
--    gains or loses a right). The admin_dispatcher role stays, for
--    users.role_id and accounts created by an older API during a deployment.
-- 2. users.role_id becomes optional: the API no longer writes it, and reads
--    it only as the fallback of CHAP EXPRESS accounts without membership.
--    Dropping it is a later migration (contract), after one release.
-- Rollback: prisma/retour-arriere/20261106180000_nettoyage_roles.sql.

-- memberships is under row-level security (FORCE applies to the owner
-- too, unless it has BYPASSRLS): read and write as the platform.
SELECT set_config('app.plateforme', 'on', false);

UPDATE "memberships"
SET "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'admin_entreprise'),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'admin_dispatcher');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
