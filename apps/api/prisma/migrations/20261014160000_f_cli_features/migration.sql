-- Migration des avis partenaires éventuels vers notations s'ils n'existent pas déjà (F-CLI-08)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'avis_partenaires') THEN
    INSERT INTO "notations" ("id", "commande_id", "cible", "partenaire_id", "livreur_id", "note", "commentaire", "created_at")
    SELECT ap."id", ap."commande_id", 'partenaire'::"CibleNotation", ap."partenaire_id", NULL, ap."note", ap."commentaire", ap."created_at"
    FROM "avis_partenaires" ap
    ON CONFLICT ("commande_id", "cible") DO NOTHING;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'avis_livreurs') THEN
    INSERT INTO "notations" ("id", "commande_id", "cible", "partenaire_id", "livreur_id", "note", "commentaire", "created_at")
    SELECT al."id", al."commande_id", 'livreur'::"CibleNotation", NULL, al."livreur_id", al."note", al."commentaire", al."created_at"
    FROM "avis_livreurs" al
    ON CONFLICT ("commande_id", "cible") DO NOTHING;
  END IF;
END $$;

-- Drop legacy avis tables (F-CLI-08)
DROP TABLE IF EXISTS "avis_partenaires" CASCADE;
DROP TABLE IF EXISTS "avis_livreurs" CASCADE;

-- F-CLI-16 & F-CLI-22: CommandeColis nature & photoPreuveUrl
ALTER TABLE "commandes_colis" ADD COLUMN IF NOT EXISTS "nature" TEXT;
ALTER TABLE "commandes_colis" ADD COLUMN IF NOT EXISTS "photo_preuve_url" TEXT;

-- F-CLI-09: User email & Commande clientEmailInvite
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
ALTER TABLE "commandes" ADD COLUMN IF NOT EXISTS "client_email_invite" TEXT;
