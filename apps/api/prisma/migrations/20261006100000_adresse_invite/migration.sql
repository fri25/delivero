-- AlterTable: guest order addresses (F-CLI-02) belong to no account.
ALTER TABLE "adresses" ALTER COLUMN "user_id" DROP NOT NULL;
