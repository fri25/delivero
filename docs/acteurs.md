# Acteurs et permissions

## Liste des acteurs

### Client
Consulte les restaurants, commerces et services, passe commande sur les 4 services,
paie (Mobile Money ou espèces à la livraison), suit sa demande en temps réel, note le
partenaire et le livreur après prestation. Compte via téléphone + mot de passe ou OTP ;
commande possible en mode invité.

### Expéditeur de colis
Particulier, entreprise ou e-commerçant qui crée une demande d'enlèvement, renseigne
le destinataire, choisit les options (contre-remboursement, fragile), suit la
livraison et la preuve de remise. Acteur explicitement identifié comme tel dans le
cahier des charges (section 4) pour le service Colis. **[DÉDUIT]** : rien n'indique un
compte ou un parcours d'inscription distinct de celui du Client — l'expéditeur utilise
vraisemblablement le même compte, ce rôle nomme son usage du service Colis. Le
**destinataire** du colis, lui, n'a pas de compte : il reçoit une notification (OTP,
appel) sans accès à la plateforme. Voir [service-colis.md](service-colis.md).

### Restaurant partenaire
Reçoit et accepte/refuse les commandes de repas, gère son menu (plats, catégories,
photos, prix, options, rupture), ses horaires et son statut d'ouverture, consulte ses
ventes et ses relevés de reversement.

### Commerce partenaire (supermarché, boutique, pharmacie)
Publie son catalogue ou une sélection d'articles, reçoit les commandes d'emplettes le
concernant, indique ses disponibilités et ses prix, consulte ses ventes et
reversements. Acteur explicitement identifié comme tel dans le cahier des charges
(section 4). Détail opérationnel : import de catalogue par Excel/CSV possible,
signalement des indisponibilités et propositions de substitution, gestion des
horaires d'ouverture. Pour les vendeurs de marché non enregistrés comme partenaires,
le livreur achète directement sans passer par une interface commerce (voir
[service-emplettes.md](service-emplettes.md)).

### Livreur
Reçoit les courses attribuées tous services confondus, accepte, met à jour les statuts
propres à chaque service, réalise les achats pour les emplettes (pointage, photos,
ticket de caisse), encaisse et restitue les fonds (contre-remboursement colis, avances
emplettes), gère son portefeuille (plafond d'avance, solde à reverser), bascule
disponible/indisponible, consulte son récapitulatif journalier.

### Administrateur / Dispatcher
Rôle unique porté par une seule et même personne. Supervise les commandes en cours
tous services confondus, attribue et réattribue les courses, saisit manuellement les
demandes reçues hors plateforme (téléphone, WhatsApp), valide les demandes sensibles,
gère les incidents et litiges. Gère aussi les partenaires (restaurants, commerces),
menus/catalogues pour leur compte si besoin, livreurs, zones, grilles tarifaires,
promotions, rapprochement et clôture de caisse, consulte les statistiques.

### Direction
Consulte les tableaux de bord et le reporting d'activité par service. Pas d'action
opérationnelle sur les commandes.

## Matrice de permissions (acteur × action)

Légende : ✔ autorisé · ✔* autorisé avec restriction (voir note) · — non autorisé

| Action | Client | Expéditeur de colis | Restaurant | Commerce partenaire | Livreur | Admin/Dispatcher | Direction |
|---|---|---|---|---|---|---|---|
| Consulter catalogues (restaurants/commerces) | ✔ | — | — | — | — | ✔ | — |
| Passer commande (4 services) | ✔ | ✔* (colis) | — | — | — | ✔* (saisie manuelle) | — |
| Payer (Mobile Money / espèces) | ✔ | ✔ | — | — | — | — | — |
| Suivre une commande en temps réel | ✔ | ✔* (colis) | ✔* (les siennes) | ✔* (les siennes) | ✔* (les siennes) | ✔ (toutes) | — |
| Noter partenaire / livreur | ✔ | ✔* (livreur) | — | — | — | — | — |
| Accepter / refuser une commande repas | — | — | ✔ | — | — | ✔* (en incident) | — |
| Gérer menu / catalogue produits | — | — | ✔ (le sien) | ✔ (le sien) | — | ✔* (saisie pour compte partenaire peu équipé) | — |
| Gérer horaires / statut ouverture | — | — | ✔ | ✔ | — | — | — |
| Consulter ventes et reversements | — | — | ✔ (les siens) | ✔ (les siens) | — | ✔ (tous) | ✔ (lecture globale) |
| Recevoir un reversement de contre-remboursement (Colis) | — | ✔ | — | — | — | — | — |
| Recevoir / accepter une course attribuée | — | — | — | — | ✔ | — | — |
| Mettre à jour le statut d'une course | — | — | ✔* (préparation repas) | ✔* (préparation click&collect) | ✔ | ✔* (correction manuelle) | — |
| Encaisser / avancer des fonds | — | — | — | — | ✔ | — | — |
| Consulter / gérer son portefeuille (plafond, solde) | — | — | — | — | ✔ (le sien) | ✔ (tous) | — |
| Attribuer / réattribuer une course | — | — | — | — | — | ✔ | — |
| Valider une demande sensible | — | — | — | — | — | ✔ | — |
| Saisir une demande reçue hors plateforme | — | — | — | — | — | ✔ | — |
| Gérer incidents / litiges | — | ✔* (signalement) | ✔* (signalement) | ✔* (signalement) | ✔* (signalement) | ✔ (traitement) | — |
| Gérer partenaires (création, commission, suspension) | — | — | — | — | — | ✔ | — |
| Gérer livreurs (pièces, zones, plafonds) | — | — | — | — | — | ✔ | — |
| Gérer zones et grilles tarifaires | — | — | — | — | — | ✔ | — |
| Gérer promotions | — | — | — | — | — | ✔ | — |
| Rapprochement / clôture de caisse | — | — | — | — | ✔* (clôture de sa propre caisse) | ✔ (validation, tous livreurs) | — |
| Consulter tableaux de bord / statistiques | — | — | ✔* (les siens) | ✔* (les siens) | ✔* (les siens) | ✔ (tous) | ✔ (tous) |
| Exporter des données (Excel/CSV) | — | — | — | — | — | ✔ | ✔* [À ARBITRER] |

**Notes**
- **Décidé (2026-08-23)** — Le back-office Admin/Dispatcher est modélisé avec des
  permissions granulaires dès la conception (liste de permissions attribuées au rôle,
  pas un rôle monolithique câblé en dur), même si un seul rôle (`admin_dispatcher`)
  est effectivement exposé au lancement. Objectif : pouvoir introduire un second rôle
  (ex. « dispatching » séparé d'« administration ») plus tard sans refonte du modèle
  d'autorisation. Voir [decisions-ouvertes.md](decisions-ouvertes.md) Q-09 et
  [modele-donnees.md](modele-donnees.md).
  **État du code (30/08/2026)** : jusqu'ici cette conception n'était pas
  appliquée — `RolesGuard` ne lisait que le nom du rôle du JWT, jamais la
  table `RolePermission`. Elle est désormais évaluée : chaque contrôleur
  `apps/api/src/admin/*` porte un `@RequirePermissions(...)` qui vérifie que
  le rôle de l'appelant a bien le ou les codes requis (voir
  `apps/api/src/auth/decorators/require-permissions.decorator.ts`). Sans
  effet observable tant qu'un seul rôle existe et porte tous les codes, mais
  un second rôle plus restreint échouera désormais réellement sur les
  actions qui lui manquent.
- La colonne « Expéditeur de colis » documente l'usage du service Colis par un
  compte Client ; ce n'est pas un compte techniquement distinct (voir
  [service-colis.md](service-colis.md)).
- Le destinataire d'un colis et le bénéficiaire d'une course express n'ont pas de
  compte : ils reçoivent des notifications (OTP, appel, SMS/WhatsApp) sans accès à la
  plateforme.
