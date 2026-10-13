# Modules — checklist fonctionnelle

Checklist exhaustive par module, avec ID stable réutilisable en ticket. Détail des
parcours et règles : voir les fiches de service. Détail des règles métier
transversales : [regles-gestion.md](regles-gestion.md).

**Statut** (dernière mise à jour 2026-09-23, sur le code réel de `apps/` — voir aussi
[decisions-arbitrage.md](decisions-arbitrage.md) pour le phasage retenu
Repas → Colis → Emplettes → Courses express) :
`[x]` fait · `[ ]` *(partiel : ...)* commencé mais incomplet · `[ ]` non commencé.

> **Périmètre V1 (23/09/2026) — Repas, Colis, Courses express, paiement Mobile
> Money uniquement.**
> Les espèces à la livraison sont retirées de tous les parcours, et avec elles le
> contre-remboursement Colis (F-CLI-18, RG-04). Écart assumé avec RG-01 —
> FedaPay est intégré depuis le 05/10 (F-ADM-16, paiement à la commande) mais
> **pas encore validé en sandbox** : ne pas ouvrir à de vrais clients avant ce
> test de bout en bout. Détail et interrupteurs :
> [regles-gestion.md](regles-gestion.md) RG-01 et RG-04.
>
> **Emplettes est masqué**, pas supprimé : le code reste intégralement en place
> et les cases ci-dessous décrivent toujours ce qui est implémenté. Ce qui
> change est l'exposition — points d'entrée retirés du hub client, des routes
> client et livreur, de la navigation livreur et des sélecteurs admin, et
> création refusée côté API. Un statut `[x]` dans la section Emplettes
> signifie donc « développé et testé », pas « ouvert aux clients ».
> Deux interrupteurs, à basculer ensemble pour rouvrir le service en V2 :
> `EMPLETTES_ACTIF` dans [`packages/config/perimetre-v1.ts`](../packages/config/perimetre-v1.ts)
> (interfaces) et `SERVICES_ACTIFS` dans l'environnement de l'API
> (`apps/api/src/config/env.validation.ts`). L'API refuse indépendamment des
> interfaces, car une PWA déjà installée conserve son ancien bundle en cache.

## Module Client (F-CLI)

### Socle commun
- [x] F-CLI-01 — Création de compte / connexion (téléphone + mot de passe ou OTP
      SMS/WhatsApp) — *(OTP ajouté le 05/10, en alternative au mot de passe :
      `POST /auth/otp/demander` et `/auth/otp/verifier`, connexion ou création
      de compte par code à 6 chiffres, comptes `client` uniquement, limites
      1 code/min et 5/h par numéro + 5 essais par code. Permet aussi à un
      client créé par le dispatcher (F-ADM-04, sans mot de passe) de récupérer
      son compte. **Envoi réel non branché** : la messagerie écrit les codes
      dans les logs de l'API tant qu'aucun fournisseur WhatsApp/SMS n'est
      choisi — voir F-CLI-09)*
- [x] F-CLI-02 — Commande en mode invité — *(fait le 06/10 pour Repas, Colis et
      Courses express — Emplettes masqué : `POST /invite/commandes/*`, nom +
      téléphone + point de repère saisis sur place (`Adresse.userId` nul),
      paiement à la commande comme pour un compte. L'invité reçoit un lien
      signé `/suivi/<id>.<hmac>` (HMAC de l'id, **rien n'est stocké** : aucune
      réponse API ne peut le divulguer), aussi envoyé par WhatsApp/SMS ; ce
      lien est la seule clé pour suivre, payer, annuler et noter. Notifications
      par WhatsApp/SMS uniquement (pas de push sans compte), suivi par polling.
      Contact invité masqué aux livreurs avant prise en charge (V11), visible
      après. Limites : le numéro n'est pas vérifié — le paiement à la commande
      empêche qu'une commande non payée atteigne qui que ce soit ; les
      commandes invité ne sont pas rattachées au compte si l'invité s'inscrit
      ensuite)*
- [x] F-CLI-03 — Carnet d'adresses avec point de repère et localisation carte
      — *(page `/adresses` le 05/10 : ajout, modification, suppression,
      adresse par défaut présélectionnée à la commande. Position GPS du
      téléphone en complément du point de repère, avec lien de vérification
      Google Maps ; **pas de carte affichée** dans l'app, faute de clé Maps
      Platform. Suppression = archivage (`Adresse.archiveeAt`) : les
      commandes gardent leur adresse. 13/10 : **quartier obligatoire** choisi
      dans la liste (fixe les prix, Q-28) ; décision : pas de carte en V1 ;
      les adresses antérieures sans quartier sont à compléter avant de
      commander)*
- [ ] F-CLI-04 — Choix du paiement (Mobile Money ou espèces à la livraison) —
      *(partiel : **V1 : plus de choix**, Mobile Money imposé, espèces retirées
      — voir RG-01. Depuis le 05/10, la commande enchaîne sur la page FedaPay ;
      le statut du paiement et un bouton « Payer » sont affichés sur le détail
      Repas/Colis/Courses express, page de retour `/paiement/retour/:id` —
      voir F-ADM-16)*
- [x] F-CLI-05 — Suivi en temps réel de chaque demande, statuts adaptés au service —
      *(WebSocket (Socket.IO) ajouté le 27/08 sur les 4 services : le client est
      notifié à chaque changement de statut via `commande:statut`, en plus du
      polling conservé comme filet de secours — voir
      `apps/api/src/realtime/realtime.gateway.ts`)*
- [x] F-CLI-06 — Historique unifié de toutes les commandes, tous services — *(fait
      le 05/10 : `OrdersPage` agrège les services ouverts avec filtres service/statut/période,
      triés du plus récent au plus ancien et liens vers les fiches de suivi ;
      le bandeau « commande en cours » de l'accueil couvre aussi tous les
      services)*
- [x] F-CLI-07 — Recommander en un clic — *(06/10 : Repas remplit le panier
      avec les plats encore disponibles, au prix du jour (remplace le panier
      en cours après confirmation) ; Colis et Courses express rouvrent le
      formulaire pré-rempli — `apps/client/src/lib/recommander.ts`)*
- [x] F-CLI-08 — Notation du partenaire et du livreur après prestation —
      *(06/10 : 1 à 5 étoiles + commentaire facultatif, une note par cible et
      par commande, seulement après livraison ; le partenaire ne se note que
      pour Repas. Recalcule `noteMoyenne` du partenaire et du livreur —
      `apps/api/src/notations/`. **Doublon à résoudre** : la branche
      `berghinos` a ajouté un second système (`apps/api/src/avis/`, tables
      `AvisPartenaire`/`AvisLivreur`) qui recalcule lui aussi `noteMoyenne`,
      chacun écrasant la moyenne de l'autre. Le 12/10, l'app client n'affiche
      plus que « Notations » (décision utilisateur) ; l'API avis reste en
      place en attendant d'être retirée ou fusionnée)*
- [ ] F-CLI-09 — Notifications SMS/WhatsApp/e-mail aux étapes clés — *(partiel,
      05/10 : Web Push (VAPID) sur l'app client + repli WhatsApp/SMS dès
      qu'aucun push n'est remis, aux étapes clés des 4 services, au paiement
      reçu et à la nouvelle commande restaurant — voir
      `apps/api/src/notifications/`. Fournisseur choisi le 13/10 : **Twilio**
      (pilote `TwilioMessagerie`, WhatsApp puis repli SMS,
      `MESSAGERIE_FOURNISSEUR="twilio"`) — **identifiants Twilio à fournir**,
      `console` par défaut en attendant. Clés VAPID à générer par
      environnement (faites en dev local le 13/10). Pas d'e-mail ; push non
      proposé dans les apps partenaires/livreur)*
- [x] F-CLI-10 — Accueil présentant les 4 services et orientant vers le bon parcours
      — *(`ServicesHubPage` est la route `/`, une carte photo par service
      (Colis / Courses express : photos Pexels provisoires), « Comment ça
      marche » en 3 étapes et contact WhatsApp. Refonte du 12/10 : barre
      d'onglets mobile (Accueil, Commandes, Panier, Compte), page `/compte`
      qui regroupe adresses, aide et déconnexion, version PC (en-tête avec
      liens services, pied de page, formulaires sur deux colonnes)*

### Repas
- [x] F-CLI-11 — Catalogue des restaurants (recherche, filtres cuisine/prix/note/délai)
      — *(06/10 : filtres cuisine (8 types réels de l'annexe A), note ≥ 4,
      délai ≤ 20 min, 3 tranches de prix, ouverts. Types de cuisine et délai
      saisis par le restaurant (`apps/partenaires`, Paramètres). **[DÉDUIT]** :
      le prix est le prix moyen des plats (hors boissons/suppléments) et les
      tranches (< 1 500 / 1 500–3 000 / > 3 000 FCFA) ne viennent d'aucune
      spécification — `apps/client/src/lib/filtres-catalogue.ts`)*
- [x] F-CLI-12 — Fiche restaurant (menu par catégories, photos, prix, délai)
- [x] F-CLI-13 — Panier repas (plats, options, suppléments, instructions)
- [x] F-CLI-14 — Suivi de statut Repas

### Colis
- [x] F-CLI-15 — Création d'une demande d'envoi (adresses, coordonnées destinataire)
- [x] F-CLI-16 — Description du colis (nature, taille, valeur déclarée, photo, fragile)
      — *(partiel : taille/valeur déclarée/fragile + photo (Cloudinary, 06/10)
      faits ; pas de champ "nature")*
- [x] F-CLI-17 — Estimation immédiate du tarif — *(13/10 : prix = quartier de
      livraison du destinataire, calculé dès le choix du quartier, aussi sans compte)*
- [x] F-CLI-18 — Option contre-remboursement — *(implémenté et testé, mais
      **masqué en V1** : suppose un encaissement espèces auprès du destinataire,
      voir RG-04)*
- [x] F-CLI-19 — Programmation de l'enlèvement (immédiat ou planifié)
- [x] F-CLI-20 — Rappel des objets interdits + acceptation des conditions
- [x] F-CLI-21 — Suivi de statut Colis
- [x] F-CLI-22 — Consultation de la preuve de livraison — *(côté client Colis :
      date de remise, nom du réceptionnaire et code de remise vérifié affichés ;
      aucune photo, stockage S3 absent)*

*(Backend + écrans client/livreur/suivi public livrés le 2026-08-27, voir
[api-colis.md](api-colis.md) et [service-colis.md](service-colis.md). Hors
périmètre volontaire de cette passe : mode invité (cohérence avec Repas),
validation des colis de valeur élevée — RG-11, seuil non arbitré et aucun
back-office pour la traiter —, portefeuille livreur consolidé/reversement
expéditeur — RG-04, chantier séparé —, et toute capture/upload de photo —
aucun stockage S3 intégré.)*

### Courses express
- [x] F-CLI-23 — Description libre de la commission + photos/pièces jointes —
      *(texte + jusqu'à 3 photos depuis le 06/10 : stockage Cloudinary, upload
      direct signé depuis le navigateur après compression ≤ 300 Ko —
      `apps/api/src/medias/`. Photos visibles du livreur. Pas de pièce jointe
      non-image)*
- [x] F-CLI-24 — Définition d'étapes multi-arrêts
- [x] F-CLI-25 — Estimation du tarif + validation avant confirmation —
      *(estimation faite ; le tarif est de toute façon recalculé et fixé côté
      serveur à la création, pas de "validation" distincte d'un montant
      variable. 13/10 : quartier le plus cher des arrêts × nombre d'arrêts)*
- [ ] F-CLI-26 — Échange direct client ↔ livreur (appel/messagerie) —
      *(partiel : appel dans les deux sens — lien `tel:` vers le client côté
      livreur, et depuis le 05/10 carte « Votre livreur » (nom + Appeler) sur
      le détail de commande côté client, 4 services. 13/10 : bouton WhatsApp
      (lien wa.me) à côté de l'appel, des deux côtés — décision : pas de
      messagerie intégrée en V1, `packages/config/whatsapp.ts`)*
- [x] F-CLI-27 — Suivi de statut Courses express

*(Backend + écrans client/livreur livrés le 2026-08-27, voir
[api-courses-express.md](api-courses-express.md) et
[service-courses-express.md](service-courses-express.md). Hors périmètre :
validation dispatcher des commissions inhabituelles (RG-11, pas de
back-office), avance de fonds pour achat simple ([À ARBITRER]),
renégociation de prix/délai en cours d'exécution ([À ARBITRER]), messagerie
intégrée (un lien `tel:` en tient lieu côté livreur).)*

*(4ᵉ et dernier service du phasage retenu — les 4 services ont désormais un
backend et des écrans client/livreur, mode(s) simplifié(s) documentés dans
chaque `api-*.md`. Le back-office (F-ADM) reste entièrement à faire.)*

### Emplettes

> **Masqué en V1** (voir l'encadré en tête de fichier) : les cases cochées
> ci-dessous décrivent du code livré et testé, aujourd'hui sans point d'entrée
> ouvert aux clients.

- [x] F-CLI-28 — Mode (a) : liste de courses libre (texte ou photo) —
      *(texte fait ; pas de photo de la liste, aucun stockage S3 intégré)*
- [ ] F-CLI-29 — Mode (b) : catalogue partenaire (supermarché/pharmacie), montant
      connu à l'avance — *(non fait, passe séparée — suppose le module Commerce
      partenaire, absent)*
- [x] F-CLI-30 — Budget maximum + validation en cas de dépassement (mode (a)
      uniquement, voir [service-emplettes.md](service-emplettes.md)) —
      *(blocage + validation/refus faits ; pas de délai d'attente maximum ni
      d'escalade automatique — Q-26 non arbitré fermement, pas de tâche
      planifiée dans ce projet)*
- [x] F-CLI-31 — Préférences de remplacement par article
- [x] F-CLI-32 — Suivi article par article pendant les achats — *(pointage
      acheté/indisponible/remplacé avec prix réel fait ; pas de photo par
      article — S3 absent)*
- [ ] F-CLI-33 — Consultation du ticket de caisse / récapitulatif — *(partiel :
      un récapitulatif texte du livreur est affiché au client ; pas de photo de
      ticket — S3 absent)*
- [x] F-CLI-34 — Décompte final transparent
- [x] F-CLI-35 — Choix du financement (Mobile Money anticipé / espèces à la livraison)
- [ ] F-CLI-36 — Jonction d'une photo d'ordonnance (pharmacie) — *(non
      applicable en mode liste libre ; concerne le mode catalogue/pharmacie,
      hors périmètre de cette passe)*
- [x] F-CLI-37 — Suivi de statut Emplettes

*(Backend + écrans client/livreur livrés le 2026-08-27, mode liste libre
uniquement — voir [api-emplettes.md](api-emplettes.md) et
[service-emplettes.md](service-emplettes.md). Mode catalogue partenaire, le
module Commerce partenaire qu'il suppose, l'appel client intégré en dur (un
lien `tel:` existe côté livreur) et le portefeuille livreur consolidé restent
hors périmètre. 3ᵉ dans l'ordre de phasage, livré comme les 3 autres services.)*

## Module Restaurant (F-RES)

- [x] F-RES-01 — Réception des commandes en temps réel, alerte sonore — *(WebSocket
      ajouté le 27/08 : événement `commande:nouvelle` + bip généré (Web Audio,
      pas de fichier son) côté `apps/partenaires` ; le polling sur `me/commandes`
      reste en filet de secours)*
- [x] F-RES-02 — Acceptation ou refus motivé dans un délai imparti — *(acceptation/
      refus avec motif faits ; le délai imparti n'est pas mis en œuvre)*
- [x] F-RES-03 — Indication du temps de préparation, passage à « commande prête »
- [x] F-RES-04 — Gestion du menu (plats, catégories, photos, prix, options)
- [x] F-RES-05 — Activation/désactivation d'un plat en un clic (rupture)
- [x] F-RES-06 — Gestion des horaires d'ouverture, statut « temporairement fermé »
- [ ] F-RES-07 — Tableau de bord des ventes (commandes du jour, CA, plats les plus
      vendus)
- [ ] F-RES-08 — Relevés de reversement détaillés
- [ ] F-RES-09 — Canal de secours WhatsApp/SMS

## Module Commerce partenaire (F-COM)

- [ ] F-COM-01 — Gestion du catalogue (produits, catégories, photos, prix, unités)
- [ ] F-COM-02 — Import du catalogue par fichier Excel/CSV
- [ ] F-COM-03 — Réception des commandes Emplettes le concernant
- [ ] F-COM-04 — Préparation en amont / click & collect interne
- [ ] F-COM-05 — Signalement des indisponibilités + propositions de substitution
- [ ] F-COM-06 — Gestion des horaires d'ouverture, statut « temporairement fermé »
- [ ] F-COM-07 — Tableau de bord des ventes + relevés de reversement
- [ ] F-COM-08 — Canal de secours WhatsApp/SMS

*(Module entièrement à faire : `Partenaire.type = commerce` existe dans le schéma
mais aucun catalogue produit, route ou écran ne l'exploite — l'app `apps/partenaires`
ne sert aujourd'hui que les restaurants.)*

## Module Livreur (F-LIV)

- [x] F-LIV-01 — Réception des courses attribuées, tous services (type, points,
      repères, liste d'achats, montants à avancer/encaisser) — *(fait pour les
      4 services : Repas, Colis, Emplettes, Courses express)*
- [x] F-LIV-02 — Acceptation de la course — *(4 services ; la prise en charge
      est atomique sur les 4 (Repas inclus depuis le correctif V02/V02b du
      27/08), gère explicitement le cas "déjà pris" par un autre livreur et
      revalide la zone du livreur à l'assignation)*
- [x] F-LIV-03 — Mise à jour des statuts propres à chaque service — *(4
      services)*
- [x] F-LIV-04 — Emplettes : pointage article par article, saisie prix réels, photo
      du ticket de caisse — *(pointage + prix réels faits ; pas de photo — S3
      absent, un récapitulatif texte en tient lieu)*
- [ ] F-LIV-05 — Emplettes : appel client intégré — *(partiel : lien `tel:` vers
      le client affiché sur chaque commande Emplettes, pas de messagerie
      intégrée)*
- [ ] F-LIV-06 — Colis : contrôle visuel + photo à l'enlèvement — *(partiel :
      confirmation de récupération faite ; ni contrôle visuel formalisé ni photo
      — aucun stockage S3 intégré. Écart avec la demande initiale : le "nom du
      réceptionnaire" a été implémenté à la livraison, pas à l'enlèvement, pour
      rester fidèle au contrat d'API de la passe 1 — voir api-colis.md)*
- [x] F-LIV-07 — Colis : saisie du code de confirmation ou photo de remise +
      encaissement du contre-remboursement — *(code de remise désormais
      obligatoire à la livraison (correctif sécurité V01 du 27/08, RG-07
      imposé) ; nom du réceptionnaire reste une information complémentaire ;
      pas de photo — S3 absent)*
- [x] F-LIV-08 — Itinéraires multi-arrêts (ouverture dans Google Maps) — *(ajouté le
      02/09 : les liens "Itinéraire" ouvrent désormais un vrai calcul d'itinéraire
      Google Maps (origine = position GPS actuelle du livreur, via le deep-link
      `google.com/maps/dir`) au lieu d'une simple recherche par point — voir
      `apps/livreur/src/lib/format.ts` `googleMapsRouteUrl`. Pour Courses express,
      un lien "Itinéraire complet" combine toutes les étapes restantes en un seul
      trajet multi-arrêts, recalculé au fil de la progression. N'utilise aucune clé
      API Google Maps Platform — deep-link uniquement, pas de géocodage serveur ni
      de carte affichée in-app ; ces volets (carte à la création d'adresse F-CLI-03,
      suivi position livreur en direct) restent à faire et nécessitent une clé
      Maps Platform facturée que l'utilisateur doit fournir)*
- [ ] F-LIV-09 — Portefeuille livreur (plafond d'avance, montants avancés/encaissés,
      solde à reverser) — *(partiel : les plafonds d'avance et de caisse
      (`Livreur.plafondAvance`/`plafondCaisse`) sont vérifiés à l'attribution
      (automatique et manuelle) sur les 4 services depuis le 29/08, chaque
      encaissement espèces est tracé dans `MouvementPortefeuille` à la
      livraison, et le solde (avance en cours, caisse à reverser) est désormais
      exposé et affiché depuis le 30/08 — côté livreur (`GET
      /livreurs/me/portefeuille`, écran "Mon portefeuille") et côté admin
      (`GET /admin/livreurs` enrichi, colonnes de la page Livreurs) — voir
      `apps/api/src/portefeuille/portefeuille.service.ts`. Clôture de caisse
      journalière ajoutée le 30/08 (`POST /livreurs/me/cloture-caisse`, une
      par jour calendaire UTC — voir F-ADM-13). Toujours absent : pas de
      mouvement de type "avance" réellement enregistré (`getAvanceEnCours`
      recalcule à la volée depuis les commandes Emplettes en cours), pas de
      reversement à l'expéditeur (RG-04) — voir F-LIV-11)*
- [x] F-LIV-10 — Statut disponible / indisponible — *(disponible/indisponible fait,
      sans motif de passage en indisponible)*
- [ ] F-LIV-11 — Récapitulatif journalier (courses par service, montants, gains)
      — *(partiel, ajouté le 30/08 : nombre de courses livrées aujourd'hui par
      service, encaissements et avances Emplettes du jour (déjà tracés par le
      portefeuille) — `GET /livreurs/me/recap-journalier`, carte "Aujourd'hui"
      sur l'écran portefeuille. Pas de "gains" : Q-08
      (decisions-ouvertes.md) laisse le modèle de rémunération du livreur
      entièrement ouvert et cite explicitement ce récapitulatif comme
      bloqué par cette question — choix confirmé par l'utilisateur le 30/08
      plutôt que d'inventer un chiffre)*

*(Mode dégradé hors ligne — IndexedDB + file de mutations, exigé par
[pwa-offline.md](pwa-offline.md) pour ce module — non trouvé dans `apps/livreur`.)*

## Module Back-office — Admin/Dispatcher (F-ADM)

L'app `apps/admin` a été bootstrappée le 28/08 (routeur, TanStack Query, Zustand,
shadcn/ui — mêmes fondations que `partenaires`/`client`, jusque-là un squelette vide).
Compte de démo : `+22900000004` / `demo12345` (rôle `admin_dispatcher`, voir
`prisma/seed.ts`).

### Supervision et dispatching
- [x] F-ADM-01 — Vue d'ensemble des demandes en cours, tous services (filtres, code
      couleur par statut, alertes de retard) — *(filtre par service et pagination
      faits ; pas de code couleur par statut ni d'alerte de retard)*
- [x] F-ADM-02 — Attribution automatique des courses (livreur disponible le plus
      proche / rotation) — *(par rotation uniquement : le livreur disponible de
      la zone dont la dernière commande assignée est la plus ancienne, filtré
      par les plafonds RG-02 — pas de "plus proche", aucune intégration
      cartographique. Choix documenté en `[DÉDUIT]` dans
      `admin-commandes.service.ts`, RG-14 ne tranche pas le départage)*
- [x] F-ADM-03 — Réattribution manuelle d'une course — *(même endpoint que
      F-ADM-02 avec un `livreurId` explicite ; contourne volontairement zone
      et plafonds, contrairement à l'automatique)*
- [x] F-ADM-04 — Saisie manuelle d'une demande reçue hors plateforme (téléphone,
      WhatsApp), pour les 4 services — *(ajouté le 31/08 : page "Saisie manuelle",
      un formulaire par service. Le mode invité (F-CLI-02) n'existant pas, un
      compte client "coquille" est créé ou retrouvé par numéro de téléphone
      (sans mot de passe) puis la commande passe par le même `create()` que le
      parcours client normal — même tarification, mêmes validations, aucune
      logique dupliquée. Voir
      `apps/api/src/admin/admin-saisie-manuelle.service.ts`. Mode de paiement
      fixé à "espèces" dans le formulaire (pas de saisie Mobile Money côté
      dispatcher) ; limite assumée : si l'appelant s'inscrit plus tard
      normalement, son numéro est déjà pris, aucune fusion de compte prévue)*
- [ ] F-ADM-05 — Validation des demandes sensibles
- [ ] F-ADM-06 — Gestion des incidents (annulation, remboursement, litige, client
      injoignable, colis refusé/endommagé, article contesté)
- [ ] F-ADM-07 — Journal complet des actions (traçabilité)

### Administration et pilotage
- [ ] F-ADM-08 — Gestion des partenaires (création, convention, taux de commission,
      suspension) — *(partiel côté données : `Partenaire.tauxCommission` existe,
      aucune interface d'administration)*
- [ ] F-ADM-09 — Gestion des livreurs (enregistrement, pièces, zones, plafonds,
      performance) — *(partiel : enregistrement (création de compte + profil),
      zone et plafonds faits ; pas de gestion des pièces d'identité — aucun
      stockage S3 — ni de statistiques de performance)*
- [x] F-ADM-10 — Gestion des zones et des grilles tarifaires par service —
      *(création/modification d'une zone avec ses 3 tarifs — Repas, Colis,
      Courses express — en une fois. 13/10 : page « Quartiers » (ajout, prix,
      masquer/réactiver) qui fixe désormais les prix Repas / Colis / Courses ;
      les tarifs par zone ne servent plus qu'à Emplettes. La saisie manuelle
      demande le quartier)*
- [ ] F-ADM-11 — Gestion des promotions (codes promo, réductions, livraison offerte)
- [ ] F-ADM-12 — Rapprochement de caisse (avances, encaissements espèces,
      contre-remboursements) — *(partiel, ajouté le 30/08 : page "Caisse"
      listant les clôtures déclarées par les livreurs, avec un bouton "Marquer
      rapprochée" qui trace qui l'a fait et quand — voir
      `apps/api/src/admin/admin-caisse.service.ts`. Ne couvre que
      l'encaissement espèces (Repas, contre-remboursement Colis, Emplettes) ;
      "avances" n'a pas de mouvement dédié (voir F-LIV-09). Le rapprochement
      ne fait que prendre acte de l'écart : aucune procédure de relance,
      retenue ou blocage — **[À ARBITRER]** dans regles-gestion.md RG-03)*
- [x] F-ADM-13 — Clôture de caisse journalière par livreur — *(le livreur
      déclare le montant en espèces compté, comparé au montant théorique
      (encaissements pas encore clôturés) ; une clôture par jour calendaire
      UTC — `POST /livreurs/me/cloture-caisse`, voir
      `apps/api/src/portefeuille/portefeuille.service.ts` méthode
      `cloturerCaisse`)*
- [ ] F-ADM-14 — Tableaux de bord (demandes, CA, panier moyen, taux d'annulation,
      délais moyens, classement partenaires/livreurs)
- [ ] F-ADM-15 — Export des données (Excel/CSV)

### Paiements (configuration transversale portée par le back-office)
- [ ] F-ADM-16 — Intégration de l'agrégateur Mobile Money (MTN MoMo, Moov Money,
      Celtiis) — *(partiel, intégré le 05/10 : FedaPay (Q-07), page de paiement
      hébergée + webhook signé (HMAC `X-FEDAPAY-SIGNATURE`), statut relu auprès
      de l'API FedaPay à chaque retour client et webhook — voir
      `apps/api/src/paiements/`. Décisions du 05/10 : paiement **à la
      commande** — une commande Mobile Money non payée n'est visible ni du
      restaurant, ni des livreurs, ni de l'attribution — et **remboursement
      manuel** : refus/annulation d'une commande payée => paiement
      `a_rembourser`. **Pas encore validé en sandbox** (clés à renseigner
      dans `apps/api/.env`). Restent à faire : écran back-office des
      remboursements, expiration des commandes jamais payées, paiement des
      commandes saisies par le dispatcher (F-ADM-04))*
- [ ] F-ADM-17 — Calcul automatique des commissions par partenaire et par service
      (Emplettes : commission uniquement en mode (b) catalogue partenaire, aucune en
      mode (a) liste libre — voir [regles-gestion.md](regles-gestion.md) RG-08)
- [ ] F-ADM-18 — Génération des relevés de reversement (périodicité —
      **[À ARBITRER]**, exemple cité : hebdomadaire)
- [ ] F-ADM-19 — Facturation des clients entreprises (compte, paiement fin de mois) —
      option à activer, **[À ARBITRER]** si retenue en v1
