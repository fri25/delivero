-- Anonymises a COPY of the production database before rehearsing a
-- migration on it (docs/plan-migration-multi-tenant.md, étape 0).
--
-- NEVER run on production. Restore a dump into a throwaway database first:
--   pg_restore --no-owner -d "$COPIE_URL" delivero-AAAAMMJJ-HHMM.dump
--   psql "$COPIE_URL" -v ON_ERROR_STOP=1 -f prisma/anonymiser.sql
--
-- Keeps every business row, every amount and every relation; replaces what
-- identifies a person. Deliberate differences with production, as reported
-- by prisma/comptages.ts: GPS coordinates zeroed, OTP codes and push
-- subscriptions deleted. A rehearsal therefore compares the anonymised copy
-- before and after the migration, never with production.
-- Passwords are wiped: create a rehearsal admin with prisma:bootstrap-admin.
-- Restaurant names stay (public business information).

BEGIN;

-- Refuse to run on a database that looks like production.
DO $$
BEGIN
  IF current_database() ILIKE '%prod%' OR current_database() = 'neondb' THEN
    RAISE EXCEPTION 'Base % : anonymisation refusée (copie uniquement).', current_database();
  END IF;
END $$;

UPDATE users u
SET telephone = '+22990' || lpad(x.n::text, 6, '0'),
    nom = 'Utilisateur ' || x.n,
    email = NULL,
    password_hash = NULL
FROM (SELECT id, row_number() OVER (ORDER BY created_at, id) AS n FROM users) x
WHERE u.id = x.id;

DELETE FROM otp_codes;
DELETE FROM abonnements_push;

UPDATE adresses
SET libelle = 'Adresse',
    adresse = NULL,
    point_de_repere = 'Repère anonymisé',
    latitude = NULL,
    longitude = NULL;

UPDATE partenaires SET latitude = NULL, longitude = NULL;

UPDATE commandes
SET client_nom_invite = CASE WHEN client_nom_invite IS NOT NULL THEN 'Invité' END,
    client_telephone_invite = CASE WHEN client_telephone_invite IS NOT NULL THEN '+22990000000' END,
    client_email_invite = NULL;

UPDATE commandes_colis
SET destinataire_nom = 'Destinataire',
    destinataire_telephone = '+22990000000',
    adresse_livraison = 'Adresse anonymisée',
    point_de_repere_livraison = 'Repère anonymisé',
    latitude_livraison = NULL,
    longitude_livraison = NULL,
    nom_receptionnaire = CASE WHEN nom_receptionnaire IS NOT NULL THEN 'Réceptionnaire' END,
    photo_url = NULL,
    photo_preuve_url = NULL,
    photo_enlevement_url = NULL;

UPDATE commandes_courses_express SET photo_urls = '{}';
UPDATE etapes_courses_express SET adresse = NULL, point_de_repere = 'Repère anonymisé';
UPDATE notations SET commentaire = NULL;

COMMIT;
