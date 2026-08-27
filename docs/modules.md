# Modules — checklist fonctionnelle

Checklist exhaustive par module, avec ID stable réutilisable en ticket. Détail des
parcours et règles : voir les fiches de service. Détail des règles métier
transversales : [regles-gestion.md](regles-gestion.md).

**Statut** (dernière mise à jour 2026-08-27, sur le code réel de `apps/` — voir aussi
[decisions-arbitrage.md](decisions-arbitrage.md) pour le phasage retenu
Repas → Colis → Emplettes → Courses express) :
`[x]` fait · `[ ]` *(partiel : ...)* commencé mais incomplet · `[ ]` non commencé.

## Module Client (F-CLI)

### Socle commun
- [ ] F-CLI-01 — Création de compte / connexion (téléphone + mot de passe ou OTP
      SMS/WhatsApp) — *(partiel : téléphone + mot de passe fait ; le modèle `OtpCode`
      existe en base mais aucune route d'envoi/vérification OTP)*
- [ ] F-CLI-02 — Commande en mode invité — *(non fait : `POST /commandes/repas`
      exige le rôle `client` authentifié)*
- [x] F-CLI-03 — Carnet d'adresses avec point de repère et localisation carte
- [ ] F-CLI-04 — Choix du paiement (Mobile Money ou espèces à la livraison) —
      *(partiel : mode choisi et stocké (`Paiement`), aucune intégration réelle
      d'agrégateur — voir F-ADM-16)*
- [ ] F-CLI-05 — Suivi en temps réel de chaque demande, statuts adaptés au service —
      *(partiel : stepper de statut Repas présent, pas de WebSocket/push, rafraîchi
      par polling)*
- [ ] F-CLI-06 — Historique unifié de toutes les commandes, tous services — *(non
      fait : `OrdersPage` ne liste que les commandes Repas, seul service existant)*
- [ ] F-CLI-07 — Recommander en un clic
- [ ] F-CLI-08 — Notation du partenaire et du livreur après prestation
- [ ] F-CLI-09 — Notifications SMS/WhatsApp/e-mail aux étapes clés
- [ ] F-CLI-10 — Accueil présentant les 4 services et orientant vers le bon parcours
      — *(non fait : `HomePage` est directement le catalogue restaurants, pas un
      hub de services — attendu tant qu'un seul service est livré, mais à bâtir
      avant l'ouverture de Colis)*

### Repas
- [x] F-CLI-11 — Catalogue des restaurants (recherche, filtres cuisine/prix/note/délai)
      — *(recherche par nom + filtre "ouverts" faits ; filtres cuisine/prix/note non
      trouvés)*
- [x] F-CLI-12 — Fiche restaurant (menu par catégories, photos, prix, délai)
- [x] F-CLI-13 — Panier repas (plats, options, suppléments, instructions)
- [x] F-CLI-14 — Suivi de statut Repas

### Colis
- [x] F-CLI-15 — Création d'une demande d'envoi (adresses, coordonnées destinataire)
- [x] F-CLI-16 — Description du colis (nature, taille, valeur déclarée, photo, fragile)
      — *(partiel : taille/valeur déclarée/fragile faits ; pas de champ "nature" ni de
      photo — aucun stockage de fichiers S3 intégré)*
- [x] F-CLI-17 — Estimation immédiate du tarif
- [x] F-CLI-18 — Option contre-remboursement
- [x] F-CLI-19 — Programmation de l'enlèvement (immédiat ou planifié)
- [x] F-CLI-20 — Rappel des objets interdits + acceptation des conditions
- [x] F-CLI-21 — Suivi de statut Colis
- [ ] F-CLI-22 — Consultation de la preuve de livraison — *(non fait : la preuve
      côté client se limite au statut "Livré" ; ni photo (S3 absent) ni nom du
      réceptionnaire ne sont réaffichés au client à ce stade — amélioration
      possible sans dépendance bloquante)*

*(Backend + écrans client/livreur/suivi public livrés le 2026-08-27, voir
[api-colis.md](api-colis.md) et [service-colis.md](service-colis.md). Hors
périmètre volontaire de cette passe : mode invité (cohérence avec Repas),
validation des colis de valeur élevée — RG-11, seuil non arbitré et aucun
back-office pour la traiter —, portefeuille livreur consolidé/reversement
expéditeur — RG-04, chantier séparé —, et toute capture/upload de photo —
aucun stockage S3 intégré.)*

### Courses express
- [x] F-CLI-23 — Description libre de la commission + photos/pièces jointes —
      *(texte fait ; pas de photo/pièce jointe, aucun stockage S3 intégré)*
- [x] F-CLI-24 — Définition d'étapes multi-arrêts
- [x] F-CLI-25 — Estimation du tarif + validation avant confirmation —
      *(estimation faite ; le tarif est de toute façon recalculé et fixé côté
      serveur à la création, pas de "validation" distincte d'un montant
      variable)*
- [ ] F-CLI-26 — Échange direct client ↔ livreur (appel/messagerie) —
      *(partiel : lien `tel:` vers le client affiché sur chaque commande côté
      livreur, pas de messagerie intégrée)*
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
hors périmètre.)*

*(Rien commencé — 3ᵉ dans l'ordre de phasage.)*

## Module Restaurant (F-RES)

- [ ] F-RES-01 — Réception des commandes en temps réel, alerte sonore — *(partiel :
      réception par polling via `me/commandes`, pas de push/alerte sonore vérifiée)*
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
      Colis/Emplettes/Courses express est atomique, gère explicitement le cas
      "déjà pris" par un autre livreur)*
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
      encaissement du contre-remboursement — *(code de remise et/ou nom du
      réceptionnaire faits ; pas de photo — S3 absent)*
- [ ] F-LIV-08 — Itinéraires multi-arrêts (ouverture dans Google Maps) — *(partiel :
      liens Google Maps simples faits pour Repas et Colis (2 points) et pour
      Courses express (un lien par étape) ; toujours une recherche simple
      point par point, jamais un itinéraire multi-arrêts unique calculé —
      aucune intégration cartographique réelle, voir CLAUDE.md [À FAIRE])*
- [ ] F-LIV-09 — Portefeuille livreur (plafond d'avance, montants avancés/encaissés,
      solde à reverser) — *(non fait : `Livreur.plafondAvance`/`plafondCaisse`
      existent en base, aucun mouvement de portefeuille n'est tracé — bloquant pour
      RG-02/RG-03)*
- [x] F-LIV-10 — Statut disponible / indisponible — *(disponible/indisponible fait,
      sans motif de passage en indisponible)*
- [ ] F-LIV-11 — Récapitulatif journalier (courses par service, montants, gains)

*(Mode dégradé hors ligne — IndexedDB + file de mutations, exigé par
[pwa-offline.md](pwa-offline.md) pour ce module — non trouvé dans `apps/livreur`.)*

## Module Back-office — Admin/Dispatcher (F-ADM)

L'app `apps/admin` est un squelette vide à ce stade (page unique « Socle en cours de
construction », aucune route, aucun appel API). L'intégralité du module est à faire.

### Supervision et dispatching
- [ ] F-ADM-01 — Vue d'ensemble des demandes en cours, tous services (filtres, code
      couleur par statut, alertes de retard)
- [ ] F-ADM-02 — Attribution automatique des courses (livreur disponible le plus
      proche / rotation)
- [ ] F-ADM-03 — Réattribution manuelle d'une course
- [ ] F-ADM-04 — Saisie manuelle d'une demande reçue hors plateforme (téléphone,
      WhatsApp), pour les 4 services
- [ ] F-ADM-05 — Validation des demandes sensibles
- [ ] F-ADM-06 — Gestion des incidents (annulation, remboursement, litige, client
      injoignable, colis refusé/endommagé, article contesté)
- [ ] F-ADM-07 — Journal complet des actions (traçabilité)

### Administration et pilotage
- [ ] F-ADM-08 — Gestion des partenaires (création, convention, taux de commission,
      suspension) — *(partiel côté données : `Partenaire.tauxCommission` existe,
      aucune interface d'administration)*
- [ ] F-ADM-09 — Gestion des livreurs (enregistrement, pièces, zones, plafonds,
      performance)
- [ ] F-ADM-10 — Gestion des zones et des grilles tarifaires par service — *(partiel
      côté données : `Zone.fraisLivraison` existe pour Repas uniquement, aucune
      interface d'administration)*
- [ ] F-ADM-11 — Gestion des promotions (codes promo, réductions, livraison offerte)
- [ ] F-ADM-12 — Rapprochement de caisse (avances, encaissements espèces,
      contre-remboursements)
- [ ] F-ADM-13 — Clôture de caisse journalière par livreur
- [ ] F-ADM-14 — Tableaux de bord (demandes, CA, panier moyen, taux d'annulation,
      délais moyens, classement partenaires/livreurs)
- [ ] F-ADM-15 — Export des données (Excel/CSV)

### Paiements (configuration transversale portée par le back-office)
- [ ] F-ADM-16 — Intégration de l'agrégateur Mobile Money (MTN MoMo, Moov Money,
      Celtiis) — *(FedaPay retenu, voir Q-07 — aucune intégration réelle, pas de
      module paiement/webhook dans `apps/api`)*
- [ ] F-ADM-17 — Calcul automatique des commissions par partenaire et par service
      (Emplettes : commission uniquement en mode (b) catalogue partenaire, aucune en
      mode (a) liste libre — voir [regles-gestion.md](regles-gestion.md) RG-08)
- [ ] F-ADM-18 — Génération des relevés de reversement (périodicité —
      **[À ARBITRER]**, exemple cité : hebdomadaire)
- [ ] F-ADM-19 — Facturation des clients entreprises (compte, paiement fin de mois) —
      option à activer, **[À ARBITRER]** si retenue en v1
