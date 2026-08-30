# Règles de gestion

ID stable par règle, réutilisable en ticket. Référencées depuis les fiches de service.

## RG-01 — Moyens de paiement

Deux moyens de paiement sont proposés au client sur l'ensemble des services : Mobile
Money (MTN MoMo, Moov Money, Celtiis, via l'agrégateur FedaPay — décidé, voir
[decisions-ouvertes.md](decisions-ouvertes.md) Q-07) ou espèces à la livraison. Le
choix se fait au moment de la commande, sauf pour les Emplettes où le financement
suit une règle spécifique (voir RG-05 et
[service-emplettes.md](service-emplettes.md)).

## RG-02 — Plafond d'avance et portefeuille livreur

Chaque livreur dispose d'un plafond d'avance et d'un plafond de caisse, définis par
l'administrateur. Le portefeuille livreur suit en continu : montants avancés pour des
achats (Emplettes, éventuellement Courses express), montants encaissés en espèces
(Repas, contre-remboursement Colis, Emplettes), solde net à reverser à ChapExpress.
L'attribution automatique d'une course tient compte du plafond d'avance restant du
livreur (voir RG-14).

## RG-03 — Rapprochement et clôture de caisse

Clôture de caisse journalière par livreur : rapprochement entre montants avancés,
montants encaissés et solde théorique. Écarts journalisés. Le rapprochement est
supervisé par l'administrateur pour l'ensemble des livreurs. **[À ARBITRER]** :
procédure exacte en cas d'écart constaté (relance, retenue, blocage du compte
livreur).

## RG-04 — Contre-remboursement et reversement à l'expéditeur

Sur une livraison Colis avec option contre-remboursement, le livreur encaisse un
montant auprès du destinataire. ChapExpress consolide les montants collectés par
l'ensemble des livreurs et les reverse à l'expéditeur selon une périodicité définie
(exemple cité dans le cahier des charges : hebdomadaire), avec relevé détaillé.
**[À ARBITRER]** : périodicité exacte, et existence d'une commission ChapExpress sur
ce flux en plus des frais de livraison. Voir [service-colis.md](service-colis.md).

## RG-05 — Budget maximum et dépassement (Emplettes, mode liste libre)

Le service Emplettes a deux modes de commande : (a) liste de courses libre, (b)
catalogue partenaire. Cette règle ne s'applique qu'au **mode (a)** : le client fixe un
budget maximum, et tout dépassement de ce budget pendant les achats nécessite une
validation explicite du client avant que le livreur ne poursuive. Le mode (b) a un
montant connu à l'avance à partir des prix catalogue et ne comporte pas de plafond de
ce type.

**Décidé (2026-08-23)** : en cas de dépassement, blocage par défaut des achats (le
livreur n'achète pas au-delà du budget sans validation explicite du client) — mais
l'attente d'une réponse n'est pas indéfinie : un délai d'attente maximum s'applique,
au-delà duquel la situation est traitée comme un incident. La durée exacte de ce
délai et le comportement précis une fois le délai écoulé (annulation automatique,
escalade vers le dispatcher, achat limité au budget initial) restent **[À
ARBITRER]** — voir [decisions-ouvertes.md](decisions-ouvertes.md) Q-26.
Voir [service-emplettes.md](service-emplettes.md).

## RG-06 — Préférences de remplacement d'article

Pour chaque article d'une commande Emplettes, le client peut définir une préférence
en cas d'indisponibilité : « remplacer par équivalent », « m'appeler », « ne pas
acheter ». À défaut de préférence définie pour un article donné, le comportement par
défaut est **[À ARBITRER]** (non précisé dans le cahier des charges).

## RG-07 — Preuve de livraison

- **Colis** : code de confirmation (OTP) communiqué au destinataire, et/ou photo de
  remise, et/ou nom du réceptionnaire.
- **Emplettes** : photo du ticket de caisse (supermarché/pharmacie) ou récapitulatif
  des prix négociés (marché).
- **Repas** : aucune preuve de livraison formalisée n'est spécifiée dans le cahier des
  charges. **[DÉDUIT]**.
- **Courses express** : aucune preuve formalisée par étape n'est spécifiée au-delà du
  passage de statut « étape réalisée ». **[DÉDUIT]**.

## RG-08 — Commissions par partenaire et par service

### Repas — modèle décidé (2026-08-25)

**✅ Décidé** — Pour le service Repas, la commission n'est plus une retenue
prélevée sur la vente du restaurant : c'est une ligne facturée au client, calculée
sur le sous-total de la commande.

Composition du montant payé par le client :

```
Montant total client = Prix des plats (menu)
                      + Frais de livraison (grille par zone)
                      + Commission de 15 % × (Prix des plats + Frais de livraison)
```

- **Prix des plats** : reversé en intégralité au restaurant — aucune retenue de
  commission n'est plus appliquée sur sa vente. Le taux de commission par
  restaurant (`RestaurantPartenaire.taux_commission`, voir
  [modele-donnees.md](modele-donnees.md)) n'est donc plus pertinent pour Repas ;
  il reste utilisable pour les autres services tant qu'ils suivent le modèle par
  défaut ci-dessous.
- **Frais de livraison** : grille par zone géographique, pas un calcul continu au
  kilomètre. Valeurs actées : 500 FCFA en zone centre-ville, 1 000 FCFA en zone
  plus éloignée. Ces frais sont un revenu ChapExpress, **pas** la rémunération du
  livreur (voir [decisions-ouvertes.md](decisions-ouvertes.md) Q-08, qui reste
  ouverte sur ce point précis). **[À ARBITRER]** : définition exacte de la limite
  entre zone centre-ville et zone éloignée (rayon, liste de quartiers, ou seuil de
  distance calculé via Google Maps Platform), et existence éventuelle d'un palier
  supplémentaire pour les zones très excentrées — voir
  [decisions-ouvertes.md](decisions-ouvertes.md) Q-28.
- **Commission de 15 %** : taux unique pour tous les restaurants du service Repas,
  qu'ils soient équipés de l'Interface web ou du Canal de secours WhatsApp/SMS —
  il n'y a plus de taux négocié par partenaire pour ce service. Revenu ChapExpress,
  cumulé avec les frais de livraison.
- Le décompte (plats / frais de livraison / commission) doit être affiché de
  façon transparente au client avant paiement, sur le modèle du décompte final
  Emplettes (voir [service-emplettes.md](service-emplettes.md)).
- **[À ARBITRER]** : périodicité exacte du reversement au restaurant (exemple
  cité : hebdomadaire).

**État du code (27/08/2026)** : `tauxCommission` reste seedé sur chaque
`Partenaire` pour rester aligné avec ce document, mais n'est lu par aucun
service — Repas facture 15 % en dur comme décrit ci-dessus, et Colis/Emplettes/
Courses express n'ont pas encore de modèle de commission par partenaire. Ce
n'est pas une incohérence à corriger sans nouvel arbitrage : le champ redevient
pertinent seulement si un service adopte un taux négocié par partenaire.
- **[À ARBITRER]** : ce modèle (frais séparés + commission côté client, restaurant
  payé plein tarif) est propre au Repas à ce stade. Reste à décider s'il doit être
  étendu à Courses express, Colis, ou au mode catalogue d'Emplettes, ou si ces
  services conservent le modèle par défaut ci-dessous.

Voir le détail chiffré et l'exemple d'application dans
[annexe-a-catalogue-lancement.md](annexe-a-catalogue-lancement.md).

### Modèle par défaut (services n'ayant pas de règle spécifique décidée)

Un taux de commission est défini par partenaire (restaurant, commerce) et par
service, configurable par l'administrateur lors de la création/convention du
partenaire : une retenue sur le montant de la vente, le partenaire étant reversé
net (vente − commission). Le calcul est automatique et alimente des relevés de
reversement périodiques (exemple cité : hebdomadaire — **[À ARBITRER]** pour une
confirmation générale). Ce modèle par défaut ne s'applique plus au Repas (voir
ci-dessus).

**Cas particulier des Emplettes**, qui a deux modes de commande distincts (voir RG-05
et [service-emplettes.md](service-emplettes.md)) :
- **Mode (b) catalogue partenaire** : une commission s'applique sur les articles
  achetés au catalogue, selon le modèle par défaut ci-dessus (retenue sur le
  commerce partenaire, sauf décision contraire à venir — voir point d'extension
  ci-dessus) ; elle alimente le relevé de reversement du commerce partenaire
  concerné.
- **Mode (a) liste libre** : aucun partenaire n'est enregistré dans la transaction
  (marché, achat direct par le livreur) — pas de commission possible sur les achats.
  Seuls des frais de service (facturés au client) rémunèrent ChapExpress sur ce mode.

## RG-09 — Annulations

Une commande peut être annulée par le client (avant acceptation/début d'exécution)
ou par le dispatcher (gestion d'incident). Le cahier des charges mentionne la
fonction sans détailler de règles fines (délais d'annulation autorisés, pénalités,
remboursement automatique ou manuel). **[À ARBITRER]** sur l'ensemble de ces points,
voir [decisions-ouvertes.md](decisions-ouvertes.md).

## RG-10 — Litiges et réclamations

Traités au cas par cas par le dispatcher. Un délai de réclamation de 24 h après
livraison est cité explicitement pour les Emplettes (articles manquants, écarts de
prix, qualité). **[À ARBITRER]** : ce délai s'applique-t-il aux autres services
(Colis, Repas, Courses express) ? Non précisé dans le cahier des charges.

## RG-11 — Validation des demandes sensibles

Le dispatcher doit valider manuellement avant attribution :
- un colis de valeur déclarée élevée (seuil **[À ARBITRER]**) ;
- une commande Emplettes dépassant le plafond d'avance normal ;
- une commission Courses express jugée inhabituelle.

## RG-12 — Gestion des incidents

Catégories d'incidents citées : annulation, remboursement, litige, client
injoignable, colis refusé ou endommagé, article contesté. Traités par le dispatcher
via le back-office, avec journalisation complète de chaque action (voir RG « journal
des actions », module F-ADM-07 dans [modules.md](modules.md)).

## RG-13 — Saisie manuelle par le dispatcher

Pendant la transition (et au-delà si les clients continuent d'appeler ou d'écrire sur
WhatsApp), le dispatcher peut saisir manuellement une demande pour chacun des 4
services, avec le même niveau de détail qu'une commande passée directement par le
client. Cette fonction reste active tant que les canaux téléphone/WhatsApp sont
maintenus (voir [decisions-ouvertes.md](decisions-ouvertes.md)).

## RG-14 — Attribution des courses

L'attribution automatique retient le livreur disponible le plus proche (ou par
rotation), en tenant compte : du type de service, de la capacité de transport
nécessaire (taille de colis, volume d'emplettes), et du plafond d'avance restant du
livreur (RG-02). Réattribution manuelle possible par le dispatcher à tout moment.
**[À ARBITRER]** : algorithme exact de priorisation en cas d'égalité entre plusieurs
livreurs disponibles.

**État du code (29/08/2026)** : attribution automatique implémentée par rotation
uniquement (livreur disponible de la zone dont la dernière commande assignée est
la plus ancienne), filtrée par le plafond de caisse en plus du plafond d'avance —
pas de "plus proche" (aucune intégration cartographique, voir CLAUDE.md
[À FAIRE]) ni de prise en compte de la capacité de transport. Réattribution
manuelle disponible côté back-office (`apps/admin`), contourne volontairement
zone et plafonds. Voir `apps/api/src/admin/admin-commandes.service.ts`.

## RG-15 — Facturation des clients entreprises

Option de compte entreprise avec paiement en fin de mois (facturation différée),
citée comme une fonctionnalité « à activer », donc non garantie en premier périmètre.
**[À ARBITRER]** : inclusion ou non dans le périmètre initial.

## RG-16 — Droit de refus

Le livreur et le dispatcher disposent d'un droit de refus sur toute demande jugée
illicite ou hors périmètre : objet interdit au transport (Colis), commission
suspecte (Courses express), usage détourné. Ce droit s'appuie sur une description
obligatoire de la demande et sur les CGU, avec traçabilité complète des refus.
