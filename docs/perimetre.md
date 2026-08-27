# Périmètre du projet

## Contexte

ChapExpress est une entreprise de services de livraison opérant à Natitingou et ses
environs [DÉDUIT : Bénin, d'après le contexte fourni]. Elle livre aujourd'hui des repas
à domicile via un réseau de livreurs et de restaurants partenaires, et réalise en
parallèle, de façon manuelle et informelle (téléphone, WhatsApp), des livraisons de
colis, des courses diverses et des achats pour le compte de clients.

Le fonctionnement actuel est entièrement manuel : prise de commande orale ou par
message, dispatching verbal, aucune traçabilité structurée des commandes, clients,
colis et flux financiers (avances, encaissements, contre-remboursements).

Objet du projet : numériser ce fonctionnement en une plateforme unique couvrant quatre
services, avec un point d'entrée commun pour le client.

## Les 4 services

### Repas
Commande de repas auprès des restaurants partenaires et livraison à domicile ou au
bureau. Parcours : catalogue de restaurants → menu → panier → suivi de la préparation
et de la livraison.

### Colis
Enlèvement et livraison de colis, plis et documents d'un point A à un point B, pour
particuliers, entreprises et e-commerçants. Option de contre-remboursement : le livreur
encaisse un montant auprès du destinataire, ChapExpress le reverse ensuite à
l'expéditeur.

### Courses express
Commissions diverses à la demande : dépôt/retrait de documents, achat simple dans une
boutique précise, retrait d'un produit déjà payé, démarche de proximité. Peut comporter
plusieurs étapes (multi-arrêts). Description libre par le client, tarif estimé sur la
distance et le nombre d'arrêts, validé avant confirmation.

### Emplettes
Achats pour le compte du client : marché, supermarché, pharmacie, commerce de
proximité. Deux modes de commande : liste de courses libre (texte ou photo, typiquement
pour le marché) ou catalogue partenaire (supermarché, pharmacie). Financement par
avance des fonds par ChapExpress (dans la limite d'un plafond livreur) ou paiement
anticipé du budget par le client, avec régularisation au réel après achat.

Ces quatre services sont documentés au même niveau de détail : voir
[service-repas.md](service-repas.md), [service-colis.md](service-colis.md),
[service-courses-express.md](service-courses-express.md),
[service-emplettes.md](service-emplettes.md).

## Les 5 modules

| Module | Porté par | Rôle |
|---|---|---|
| Client | Client final | Commande sur les 4 services, paiement, suivi, notation |
| Restaurant | Restaurant partenaire | Réception et gestion des commandes repas, menu, ventes |
| Commerce partenaire | Supermarché, boutique, pharmacie | Catalogue, commandes emplettes le concernant, ventes |
| Livreur | Livreur | Réception des courses tous services, exécution, encaissement, portefeuille |
| Back-office | Administrateur/Dispatcher (une seule personne) | Supervision, dispatching, gestion des partenaires, tarifs, caisse, statistiques |

Détail fonctionnel : [modules.md](modules.md). Acteurs et permissions :
[acteurs.md](acteurs.md).

## Phasage du développement

Le cahier des charges v2 proposait un phasage en trois versions (V1 web Repas+Colis,
V1.1 Courses express+Emplettes, V2 applications mobiles natives). Ce phasage reposait
sur le choix technique Flutter, désormais caduc (voir [architecture.md](architecture.md)).

**Décidé (2026-08-23)** — Ordre retenu : **Repas → Colis → Emplettes → Courses
express**. Voir [decisions-ouvertes.md](decisions-ouvertes.md) Q-01 pour l'historique
de l'arbitrage.

Raisonnement :
- **Repas** en premier : service historique de ChapExpress, volume réel et
  restaurants partenaires déjà identifiés — la digitalisation s'y voit
  immédiatement, côté clients comme côté image de marque. Parcours le plus standard,
  ce qui permet de construire le socle réutilisable (catalogue, panier, machine à
  états, dispatching, notation, notifications) sans que la complexité métier ne
  masque des erreurs d'architecture.
- **Colis** en second : réutilise ce socle en n'ajoutant qu'une brique nouvelle (la
  preuve de livraison et le contre-remboursement), et vise les e-commerçants — une
  clientèle B2B récurrente et prévisible, donc du volume rapide pour un effort de
  développement modeste.
- **Emplettes** en troisième, avant Courses express malgré son coût plus élevé :
  c'est le service qui exige l'offline complet, le portefeuille livreur et la
  régularisation au réel. Le repousser en dernier reviendrait à découvrir tard des
  contraintes qui peuvent remonter jusqu'au modèle de données.
- **Courses express** en dernier : le plus simple techniquement (description libre,
  multi-arrêts, pas de catalogue ni d'avance de fonds), donc celui qui coûte le moins
  cher à décaler.

**Réserve explicite** : cet ordre tient tant que Repas reste bien le service au plus
fort volume actuel. Si les chiffres du fonctionnement WhatsApp/téléphone montrent que
les Emplettes ou les Colis dominent en volume ou en temps de traitement manuel,
l'ordre doit être réévalué — mais Emplettes ne devrait jamais passer en premier, son
risque technique (offline, portefeuille, régularisation) est trop élevé pour un socle
non encore éprouvé.

## Hors périmètre (explicite)

- Transport de personnes (moto-taxi, VTC).
- Livraison inter-villes longue distance et messagerie nationale (extension possible
  ultérieurement, non spécifiée).
- Colis réglementés ou dangereux : produits inflammables, armes, espèces animales,
  médicaments sur ordonnance sans validation. Voir règles du service Colis
  ([service-colis.md](service-colis.md)).
- Programme de fidélité avancé (points, parrainage) — évolution future non spécifiée.
- Applications natives (Android/iOS via stores) — remplacées par une approche PWA
  installable ; le besoin d'un packaging store reste [À ARBITRER], voir
  [pwa-offline.md](pwa-offline.md).

## Hors périmètre implicite (déduit du document)

- [DÉDUIT] Aucune gestion de stock côté ChapExpress : les commerces partenaires
  gèrent leur propre disponibilité produit.
- [DÉDUIT] Aucun paiement par carte bancaire mentionné : seuls Mobile Money et espèces
  sont prévus.
- [DÉDUIT] Aucune marketplace ouverte à des livreurs indépendants non enregistrés par
  ChapExpress : le livreur est une ressource gérée par l'administrateur (zones,
  plafonds, pièces).
