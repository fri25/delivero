-- CreateEnum
CREATE TYPE "StatutMembership" AS ENUM ('actif', 'suspendu');

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "statut" "StatutMembership" NOT NULL DEFAULT 'actif',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_tenant_id_role_id_idx" ON "memberships"("tenant_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_tenant_id_key" ON "memberships"("user_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Every existing account becomes a member of CHAP EXPRESS with the role it
-- has today (docs/plan-migration-multi-tenant.md, étape 3). No role is
-- renamed here: admin_dispatcher stays admin_dispatcher (renaming moves to
-- étape 8, with the screens that manage roles). The id is derived from the
-- user id so the insert is deterministic and safe to compare.
INSERT INTO "memberships" ("id", "user_id", "tenant_id", "role_id", "statut", "updated_at")
SELECT 'mbr_' || md5(u."id"), u."id", 'tnt_chapexpress', u."role_id", 'actif', CURRENT_TIMESTAMP
FROM "users" u
ON CONFLICT ("user_id", "tenant_id") DO NOTHING;
