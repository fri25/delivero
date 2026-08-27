# PWA et stratégie hors ligne

**[DÉDUIT]** — Le cahier des charges ne spécifie pas de stratégie PWA (il prescrivait
Flutter, voir [architecture.md](architecture.md)). Ce document propose une stratégie
cohérente avec les contraintes locales (3G instable, adressage approximatif,
partenaires peu équipés) posées par le projet.

## Priorité : module Livreur

Le mode hors ligne est prioritairement développé pour le **module Livreur**, seul
module dont l'usage terrain (déplacement, zones à couverture réseau faible) rend
l'indisponibilité réseau fréquente et bloquante pour le métier (course en cours,
encaissement en attente de saisie).

Les autres modules (Client, Restaurant, Commerce partenaire, Admin/Dispatcher) restent
utilisables en mode dégradé lecture seule hors ligne, sans file de mutations dédiée.
**[À ARBITRER]** : étendre la file de mutations au module Client si l'usage terrain le
justifie après mise en production.

## Stratégie service worker par type de ressource

| Type de ressource | Stratégie | Détail |
|---|---|---|
| App shell (HTML/JS/CSS) | Cache-first, précaché au build (Vite PWA plugin) | Nouvelle version détectée en arrière-plan, application au prochain lancement avec invite explicite |
| Données API en lecture (catalogues, menus, statuts) | Stale-while-revalidate | Cache géré par TanStack Query, persisté ; affichage immédiat des dernières données connues avec rafraîchissement silencieux |
| Images (plats, produits, tickets, preuves) | Cache-first avec quota | Compression côté client avant upload (voir [exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md)) ; éviction LRU si quota de stockage atteint |
| Mutations API (module Livreur : accepter course, changer statut, pointer article, encaisser) | File de mutations locale (IndexedDB), rejeu à la reconnexion | Voir section suivante |
| Mutations API (autres modules) | Network-only avec message d'erreur explicite si hors ligne | Pas de file de mutations en v1 — **[À ARBITRER]** |
| WebSocket (suivi temps réel) | Non caché | Reconnexion automatique avec backoff ; bascule sur polling REST si la socket reste indisponible au-delà d'un délai **[À ARBITRER]** |

## File de mutations (module Livreur)

Chaque action du livreur pouvant survenir hors ligne est écrite dans une file
persistée en IndexedDB avant tentative réseau :

- Acceptation d'une course.
- Mise à jour de statut (récupérée, en route, livrée, achats en cours, etc.).
- Pointage d'un article emplettes (acheté / indisponible / remplacé) avec prix réel.
- Saisie du code de confirmation ou capture de la photo de remise (Colis).
- Enregistrement d'un encaissement ou d'une avance.

Chaque mutation en file porte : un identifiant d'idempotence, l'entité et l'action
visées, un horodatage local, un compteur de tentatives. À la reconnexion, la file est
rejouée dans l'ordre d'écriture. Une mutation acceptée par le serveur est retirée de
la file ; une mutation rejetée reste visible dans l'UI comme échec à traiter.

## Résolution de conflits

Le serveur reste seul juge de l'état final d'une commande. Principes retenus :

- Les mutations financières (encaissement, avance) ne sont **jamais** silencieusement
  ignorées ou fusionnées automatiquement : un conflit détecté (ex. course réattribuée
  à un autre livreur pendant que le premier était hors ligne) est remonté explicitement
  au livreur concerné et journalisé pour le dispatcher.
- Les mutations de statut suivent une progression attendue par service (voir les
  machines à états des fiches service) ; une mutation incompatible avec l'état serveur
  actuel est rejetée avec message explicite plutôt qu'appliquée de force.
- **[À ARBITRER]** : politique précise en cas de double encaissement détecté après
  coup (remboursement automatique, intervention manuelle du dispatcher).

## Indicateur réseau dans l'UI

- Bandeau permanent indiquant l'état de connexion (en ligne / hors ligne / synchronisation
  en cours) sur le module Livreur.
- Compteur de mutations en attente de synchronisation, visible et non bloquant pour la
  poursuite du travail.
- Blocage explicite (avec message) des seules actions nécessitant une validation
  serveur immédiate et non différable — **[À ARBITRER]** : lesquelles précisément
  (ex. validation d'un dépassement de budget Emplettes nécessitant confirmation du
  client en direct).

## Limites connues sur iOS

- Le Web Push (VAPID) n'est disponible sur Safari iOS qu'à partir d'iOS 16.4, et
  uniquement pour une PWA ajoutée à l'écran d'accueil (pas dans un onglet Safari
  standard) — le fallback WhatsApp/SMS reste donc obligatoire sur tout le périmètre
  iOS, pas seulement en secours occasionnel.
- Pas de Background Sync API sur Safari iOS : la file de mutations ne peut être
  rejouée qu'au premier plan (application ouverte), pas en tâche de fond.
- Éviction de stockage : Safari peut purger IndexedDB/localStorage après une période
  d'inactivité (politique ITP), avec risque de perte de la file de mutations en
  attente si l'application reste fermée trop longtemps. **[À ARBITRER]** : délai de
  rétention acceptable et mesure d'atténuation (ex. relance de synchronisation dès
  ouverture, alerte si file non vide depuis longtemps).
- L'ajout à l'écran d'accueil n'est pas proposé automatiquement par le navigateur
  (contrairement à Android/Chrome) : nécessite un guide utilisateur explicite dans
  l'onboarding livreur.

## Packaging store — envisageable plus tard

**[À ARBITRER]** — Si la présence sur l'App Store/Google Play s'avère nécessaire
(distribution, fiabilité push iOS, image de marque), la PWA pourra être empaquetée via
un wrapper (ex. Capacitor) sans réécriture, plutôt que redévelopper une application
native. Ce choix n'est pas requis pour le lancement et n'est pas tranché à ce stade —
voir [decisions-ouvertes.md](decisions-ouvertes.md).
