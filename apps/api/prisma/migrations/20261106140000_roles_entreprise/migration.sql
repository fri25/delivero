-- Étape 8 of docs/plan-migration-multi-tenant.md: the company back-office
-- roles. admin_entreprise and gestionnaire are created; admin_dispatcher
-- (CHAP EXPRESS until now) receives the same permissions as
-- admin_entreprise and keeps its memberships: no account changes role in
-- this release (renaming them is the étape 10 cleanup). Same lists as
-- prisma/socle.ts. Idempotent: the seed may already have inserted them.
-- Rollback: prisma/retour-arriere/20261106140000_roles_entreprise.sql.

INSERT INTO "roles" ("id", "name", "description") VALUES
  ('role_admin_entreprise', 'admin_entreprise', 'Administrateur de l’entreprise'),
  ('role_gestionnaire', 'gestionnaire', 'Gestionnaire des opérations')
ON CONFLICT ("name") DO NOTHING;

-- Ensures the existing codes too: a database bootstrapped by
-- bootstrap-admin.ts has them, an empty one would not.
INSERT INTO "permissions" ("id", "code", "description") VALUES
  ('perm_paiements_rembourser', 'paiements.rembourser', 'Traiter les remboursements Mobile Money'),
  ('perm_entreprise_parametres', 'entreprise.parametres', 'Modifier les réglages de l’entreprise (identité, FedaPay)'),
  ('perm_entreprise_utilisateurs', 'entreprise.utilisateurs', 'Gérer les comptes du back-office et leurs rôles'),
  ('perm_journal_consulter', 'journal.consulter', 'Consulter le journal d’activité'),
  ('perm_clients_consulter', 'clients.consulter', 'Consulter la liste des clients')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."code" IN ('commandes.consulter_toutes', 'commandes.saisir_manuelle', 'commandes.corriger_statut', 'commandes.valider_sensible', 'commandes.attribuer', 'partenaires.gerer', 'partenaires.gerer_menu_pour_compte', 'livreurs.gerer', 'zones.gerer', 'promotions.gerer', 'caisse.rapprocher', 'portefeuilles.consulter_tous', 'incidents.traiter', 'statistiques.consulter_tout', 'donnees.exporter', 'paiements.rembourser', 'entreprise.parametres', 'entreprise.utilisateurs', 'journal.consulter', 'clients.consulter')
WHERE r."name" IN ('admin_dispatcher', 'admin_entreprise')
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."code" IN ('commandes.consulter_toutes', 'commandes.saisir_manuelle', 'commandes.corriger_statut', 'commandes.valider_sensible', 'commandes.attribuer', 'livreurs.gerer', 'caisse.rapprocher', 'portefeuilles.consulter_tous', 'incidents.traiter', 'statistiques.consulter_tout', 'donnees.exporter', 'clients.consulter')
WHERE r."name" = 'gestionnaire'
ON CONFLICT DO NOTHING;
