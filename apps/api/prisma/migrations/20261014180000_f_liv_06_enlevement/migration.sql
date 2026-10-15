-- F-LIV-06: CommandeColis photoEnlevementUrl & etatEnlevement
ALTER TABLE "commandes_colis" ADD COLUMN IF NOT EXISTS "photo_enlevement_url" TEXT;
ALTER TABLE "commandes_colis" ADD COLUMN IF NOT EXISTS "etat_enlevement" TEXT;
