-- CreateTable
CREATE TABLE "abonnements_push" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abonnements_push_endpoint_key" ON "abonnements_push"("endpoint");

-- CreateIndex
CREATE INDEX "abonnements_push_user_id_idx" ON "abonnements_push"("user_id");

-- AddForeignKey
ALTER TABLE "abonnements_push" ADD CONSTRAINT "abonnements_push_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
