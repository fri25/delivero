# Décisions ouvertes

Questions non tranchées à date, à arbitrer avant ou pendant le développement. Format :
question, options, impact, qui tranche.

## Décisions actées

Les entrées ci-dessous restent documentées dans leur section d'origine (contexte,
options envisagées) avec un bandeau **✅ Décidé**, pour garder la trace du
raisonnement. Résumé :

| ID | Décision | Date | Détail |
|---|---|---|---|
| Q-06 | Backend : NestJS | 2026-08-23 | [architecture.md](architecture.md) |
| Q-19 | Organisation du dépôt : monorepo multi-apps | 2026-08-23 | [architecture.md](architecture.md) |
| Q-01 | Phasage : Repas → Colis → Emplettes → Courses express, sous réserve (voir détail) | 2026-08-23 | [perimetre.md](perimetre.md) |
| Q-07 | Agrégateur de paiement : FedaPay | 2026-08-23 | [architecture.md](architecture.md) |
| Q-09 | Permissions granulaires dès la conception, un seul rôle exposé au lancement | 2026-08-23 | [acteurs.md](acteurs.md) |
| Q-12 | Principe retenu : blocage par défaut avec délai d'attente maximum — comportement après expiration renvoyé à Q-26 | 2026-08-23 | [regles-gestion.md](regles-gestion.md) RG-05 |
| Q-20 | Confirmé : aucune extension au lancement, à revisiter après mise en production | 2026-08-23 | [pwa-offline.md](pwa-offline.md) |
| Q-03 (Repas) | Commission Repas : 15 % facturé au client sur (plats + livraison), restaurant payé plein tarif ; extension aux autres services encore ouverte | 2026-08-25 | [regles-gestion.md](regles-gestion.md) RG-08 |

## Produit et phasage

### Q-01 — Phasage du développement
**✅ Décidé (2026-08-23)** — Repas → Colis → Emplettes → Courses express, sous
réserve que Repas reste bien le service au plus fort volume actuel. Raisonnement et
condition de révision détaillés dans [perimetre.md](perimetre.md).

**Question** : dans quel ordre livrer les 4 services et les 5 modules ?
**Options** : (a) reprendre la logique du cahier des charges v2 — Repas + Colis
d'abord, puis Courses express + Emplettes ; (b) livrer les 4 services d'un coup sur un
périmètre restreint (peu de partenaires, une zone) ; (c) phaser par module plutôt que
par service (ex. Client + Livreur + Back-office minimal, puis Restaurant/Commerce).
**Impact** : planning, priorisation technique, ordre d'intégration des partenaires.
**Qui tranche** : Direction ChapExpress, avec recommandation de l'équipe projet.
Voir [perimetre.md](perimetre.md).

### Q-09 — Séparation des rôles dispatching / administration
**✅ Décidé (2026-08-23)** — Option (b) : modèle de permissions granulaires dès la
conception, avec un seul rôle (`admin_dispatcher`) exposé au lancement. Détail :
[acteurs.md](acteurs.md), [modele-donnees.md](modele-donnees.md).

**Question** : faut-il prévoir dès la conception une séparation des droits entre
« dispatching » et « administration », si une deuxième personne rejoint le back-office
à terme ?
**Options** : (a) rôle unique fusionné comme aujourd'hui, séparation différée ; (b)
prévoir la séparation des permissions dès le modèle de données, même si portée par une
seule personne au lancement.
**Impact** : conception de la matrice de permissions et du modèle d'autorisation.
**Qui tranche** : Direction ChapExpress. Voir [acteurs.md](acteurs.md).

### Q-24 — Expéditeur de colis : compte distinct ou rôle contextuel
**Question** : l'Expéditeur de colis est-il un compte techniquement distinct du
Client (inscription, authentification propres) ou un simple rôle contextuel porté par
le compte Client existant lorsqu'il utilise le service Colis ?
**Options** : (a) rôle contextuel du compte Client, comme documenté aujourd'hui par
défaut ([acteurs.md](acteurs.md)) ; (b) compte distinct avec ses propres attributs
(ex. raison sociale, volume d'envois, conditions négociées) pour les e-commerçants à
fort volume.
**Impact** : modèle de données (entité `CompteEntreprise` éventuelle, voir
[modele-donnees.md](modele-donnees.md)), pertinence d'une facturation entreprise
dédiée (RG-15), tarification dégressive ou conventions spécifiques pour les gros
expéditeurs.
**Qui tranche** : Direction ChapExpress, en fonction du volume réel d'e-commerçants
partenaires visé. Voir [acteurs.md](acteurs.md).

### Q-16 — Facturation des clients entreprises
**Question** : la facturation différée (compte entreprise, paiement fin de mois) est
citée comme une option « à activer » — fait-elle partie du périmètre initial ?
**Options** : (a) incluse dès le lancement ; (b) différée à une phase ultérieure.
**Impact** : modèle de données (entité compte entreprise), flux de paiement,
comptabilité. **Qui tranche** : Direction ChapExpress. Voir
[regles-gestion.md](regles-gestion.md) RG-15.

## Finance et règles de gestion

### Q-02 — Plafonds d'avance et de caisse des livreurs
**Question** : quelles valeurs pour le plafond d'avance et le plafond de caisse par
livreur ?
**Options** : valeur unique pour tous les livreurs, ou modulée par ancienneté/zone/
service. **Impact** : risque financier, capacité des livreurs à prendre des courses
Emplettes à budget élevé, algorithme d'attribution (RG-14). **Qui tranche** :
Direction ChapExpress. Voir [regles-gestion.md](regles-gestion.md) RG-02.

### Q-03 — Taux de commission par partenaire et par service
**✅ Décidé pour Repas (2026-08-25)** — Commission unique de 15 %, identique pour
tous les restaurants (plus de variation par partenaire ni par mode de réception des
commandes), calculée sur (prix des plats + frais de livraison) et facturée au
client ; le restaurant est reversé plein tarif, sans retenue. Détail :
[regles-gestion.md](regles-gestion.md) RG-08.

**Reste ouvert** : ce modèle s'applique-t-il aussi à Courses express, Colis, et au
mode catalogue d'Emplettes, ou ces services conservent-ils le modèle par défaut
(retenue sur le partenaire, taux configurable) ?
**Options** : (a) étendre le modèle Repas (frais séparés + commission client) à tous
les services partenaires, pour une expérience de facturation cohérente ; (b) garder
le Repas comme cas particulier et le modèle par défaut pour les autres services ;
(c) décider service par service. **Impact** : revenus ChapExpress, attractivité pour
les partenaires, cohérence de l'expérience client entre services, calcul des
relevés de reversement. **Qui tranche** : Direction ChapExpress. Voir
[regles-gestion.md](regles-gestion.md) RG-08.

### Q-04 — Périodicité et commission sur le contre-remboursement colis
**Question** : quelle périodicité exacte de reversement à l'expéditeur (hebdomadaire
cité en exemple), et ChapExpress prélève-t-elle une commission sur ce flux en plus des
frais de livraison ?
**Impact** : trésorerie des expéditeurs (e-commerçants), revenus additionnels
possibles. **Qui tranche** : Direction ChapExpress. Voir
[regles-gestion.md](regles-gestion.md) RG-04.

### Q-25 — Emplettes mode (b) : écart entre prix catalogue et prix réel en caisse
**Question** : quand le prix constaté en caisse diffère du prix affiché au catalogue
du commerce partenaire (mode (b)), qui absorbe l'écart — ChapExpress, le commerce
partenaire, ou le client — et à partir de quel seuil (montant ou pourcentage) le
livreur doit-il faire re-valider la commande par le client avant de poursuivre ?
**Options** : (a) écart systématiquement répercuté au client, quel que soit le
montant ; (b) écart absorbé par ChapExpress ou le commerce en dessous d'un seuil, puis
validation client obligatoire au-delà ; (c) seuil identique à la règle de dépassement
de budget du mode (a) (RG-05), par cohérence.
**Impact** : confiance du client dans un montant catalogue affiché comme fiable,
relation commerciale avec les commerces partenaires (catalogues mal tenus à jour),
charge d'appels du livreur si le seuil est trop bas.
**Qui tranche** : Direction ChapExpress. Voir
[service-emplettes.md](service-emplettes.md) et
[regles-gestion.md](regles-gestion.md) RG-08.

### Q-05 — Responsabilité en cas de perte ou de dommage d'un colis
**Question** : quel plafond de responsabilité ChapExpress applique-t-elle en cas de
perte, vol ou détérioration d'un colis, sur la base de la valeur déclarée ?
**Options** : plafond forfaitaire, plafond proportionnel à la valeur déclarée avec
maximum, assurance tierce. **Impact** : CGU, provisionnement financier, confiance des
e-commerçants. **Qui tranche** : Direction ChapExpress, validation juridique
recommandée. Voir [service-colis.md](service-colis.md).

### Q-08 — Modèle de rémunération du livreur
**Question** : comment le livreur est-il rémunéré par course (montant fixe, barème par
service/distance, pourcentage) ?
**Précision (2026-08-25)** : pour Repas, les frais de livraison payés par le client
(grille par zone, voir RG-08) sont désormais un revenu ChapExpress, pas la
rémunération directe du livreur — cette question reste donc entièrement ouverte, la
rémunération du livreur devra être financée par un mécanisme distinct.
**Impact** : attractivité pour les livreurs, calcul du récapitulatif journalier,
budget d'exploitation. **Qui tranche** : Direction ChapExpress. Voir
[service-repas.md](service-repas.md), [regles-gestion.md](regles-gestion.md) RG-08.

### Q-28 — Définition de la limite entre zone centre-ville et zone éloignée (frais de livraison Repas)
**Question** : la grille de frais de livraison Repas décidée (500 FCFA en zone
centre-ville, 1 000 FCFA en zone plus éloignée — voir
[regles-gestion.md](regles-gestion.md) RG-08) suppose une frontière entre les deux
zones. Comment cette frontière est-elle définie : rayon en kilomètres autour d'un
point de référence, liste explicite de quartiers, ou seuil de distance calculé
dynamiquement via Google Maps Platform à partir de l'adresse du restaurant et de
celle du client ? Un palier supplémentaire est-il nécessaire pour des zones très
excentrées ?
**Impact** : conception de l'entité `Zone` (voir
[modele-donnees.md](modele-donnees.md)), configuration back-office de la grille
tarifaire, cohérence perçue par le client entre deux adresses proches de part et
d'autre de la frontière. **Qui tranche** : Direction ChapExpress, avec proposition
technique de l'équipe projet. Voir [regles-gestion.md](regles-gestion.md) RG-08.

### Q-10 — Seuils de validation des demandes sensibles
**Question** : quels seuils déclenchent une validation manuelle obligatoire (valeur
d'un colis, dépassement d'avance Emplettes, caractère « inhabituel » d'une commission
Courses express) ?
**Impact** : charge de travail du dispatcher, fluidité du parcours client. **Qui
tranche** : Direction ChapExpress avec retour d'expérience du dispatcher. Voir
[regles-gestion.md](regles-gestion.md) RG-11.

### Q-11 — Comportement par défaut sans préférence de remplacement (Emplettes)
**Question** : que fait le livreur pour un article indisponible si le client n'a
défini aucune préférence pour cet article précis ?
**Options** : ne pas acheter par défaut (le plus prudent), appeler systématiquement,
remplacer par équivalent par défaut. **Impact** : expérience client, charge d'appels
du livreur. **Qui tranche** : Direction ChapExpress. Voir
[service-emplettes.md](service-emplettes.md).

### Q-12 — Dépassement de budget avec client injoignable (Emplettes)
**✅ Décidé en principe (2026-08-23)** — Blocage par défaut (le livreur n'achète pas
au-delà du budget sans validation), mais l'attente ne peut pas être indéfinie : un
délai d'attente maximum doit exister. Sa durée et le comportement une fois ce délai
écoulé restent ouverts — voir **Q-26** ci-dessous, qui reprend précisément ce point.

**Question** : le livreur doit-il bloquer les achats en attendant le client, ou
appliquer une règle par défaut (ex. ne pas dépasser, acheter le reste au budget
disponible) ?
**Impact** : délai de la course, satisfaction client, risque financier. **Qui
tranche** : Direction ChapExpress. Voir [regles-gestion.md](regles-gestion.md) RG-05.

### Q-26 — Délai d'attente maximum en cas de dépassement de budget et comportement après expiration (Emplettes)
**Question** : le principe de blocage par défaut (Q-12) est acté, mais l'attente d'une
réponse du client ne peut pas être indéfinie. Quelle est la durée maximale avant
qu'un dépassement de budget sans réponse du client soit traité comme un incident, et
que se passe-t-il alors ?
**Options** : (a) délai court (ex. 5-10 min) avec escalade automatique vers un
incident traité par le dispatcher ; (b) délai plus long avec annulation automatique de
la commande ; (c) pas d'annulation : achat limité au budget initial (le reste non
acheté), la course se termine normalement sur cette base.
**Impact** : temps d'immobilisation du livreur sur le terrain en attendant une
réponse, charge de traitement du dispatcher, satisfaction client en cas d'annulation
ou de commande incomplète.
**Qui tranche** : Direction ChapExpress.
Voir [regles-gestion.md](regles-gestion.md) RG-05,
[service-emplettes.md](service-emplettes.md).

### Q-13 — Règles d'annulation
**Question** : quels délais d'annulation sont autorisés par service, y a-t-il des
pénalités, le remboursement est-il automatique ou validé manuellement ?
**Impact** : expérience client, charge du dispatcher, trésorerie. **Qui tranche** :
Direction ChapExpress. Voir [regles-gestion.md](regles-gestion.md) RG-09.

### Q-14 — Généralisation du délai de réclamation de 24 h
**Question** : le délai de réclamation de 24 h, explicite pour les Emplettes,
s'applique-t-il aussi à Repas, Colis et Courses express ?
**Impact** : cohérence du parcours client, charge de traitement des litiges. **Qui
tranche** : Direction ChapExpress. Voir [regles-gestion.md](regles-gestion.md) RG-10.

### Q-27 — Traitement des plats à délai de préparation long ou sur commande

**Question** : le catalogue de lancement du service Repas (voir
[annexe-a-catalogue-lancement.md](annexe-a-catalogue-lancement.md)) fait apparaître
des plats à préavis ou délai de préparation très supérieur au reste du menu (ex. tête
de mouton façon Bélier, 45 min sur commande ; gâteau d'anniversaire, commande 24 h à
l'avance). Le parcours standard décrit dans [service-repas.md](service-repas.md)
suppose un délai homogène affiché au client et une acceptation/refus du restaurant
dans un délai court : comment ces plats doivent-ils être traités (créneau de retrait
différé, confirmation anticipée obligatoire par le restaurant, exclusion de
l'attribution automatique immédiate d'un livreur) ?
**Options** : (a) statut de plat spécial avec créneau de retrait choisi par le client
à la commande ; (b) validation manuelle systématique par le dispatcher avant
attribution d'un livreur ; (c) exclusion de ces plats du parcours en libre-service au
lancement, vente uniquement par contact direct avec le restaurant.
**Impact** : conception du parcours de commande et de la machine à états Repas,
expérience client, charge du dispatcher.
**Qui tranche** : Direction ChapExpress. Voir
[annexe-a-catalogue-lancement.md](annexe-a-catalogue-lancement.md) §A.5,
[service-repas.md](service-repas.md).

### Q-15 — Algorithme d'attribution en cas d'égalité entre livreurs
**Question** : quel critère départage deux livreurs disponibles à égale distance
(rotation stricte, ancienneté de la dernière course, note moyenne) ?
**Impact** : équité perçue entre livreurs, qualité de service. **Qui tranche** :
équipe projet + retour terrain du dispatcher. Voir
[regles-gestion.md](regles-gestion.md) RG-14.

## Technique

### Q-06 — Choix du backend
**✅ Décidé (2026-08-23)** — NestJS. Détail : [architecture.md](architecture.md).

**Question** : NestJS (Node.js/TypeScript) ou Laravel (PHP) pour l'API REST ?
**Impact** : compétences internes/prestataires disponibles, cohérence de langage avec
le front-end (TypeScript de bout en bout si NestJS), écosystème de librairies.
**Qui tranche** : équipe technique, à valider avec la direction sur le critère
disponibilité de compétences. Voir [architecture.md](architecture.md).

### Q-07 — Choix de l'agrégateur de paiement Mobile Money
**✅ Décidé (2026-08-23)** — FedaPay. Détail : [architecture.md](architecture.md).

**Question** : FedaPay ou KkiaPay pour l'intégration MTN MoMo / Moov Money / Celtiis ?
**Impact** : couverture réseau effective, frais de transaction, fiabilité constatée
localement, qualité de la documentation d'intégration. **Qui tranche** : Direction
ChapExpress après test technique des deux options. Voir
[architecture.md](architecture.md).

### Q-17 — État client : TanStack Query + Zustand
**Question** : Zustand est-il retenu pour l'état UI local, en complément de TanStack
Query pour l'état serveur ?
**Impact** : cohérence d'architecture front-end, courbe d'apprentissage. **Qui
tranche** : équipe technique. Voir [architecture.md](architecture.md).

### Q-18 — UI kit : Tailwind CSS + shadcn/ui
**Question** : ce choix de système de composants est-il confirmé pour les 5 modules ?
**Impact** : vitesse de développement, cohérence visuelle, poids du bundle CSS. **Qui
tranche** : équipe technique. Voir [architecture.md](architecture.md).

### Q-19 — Organisation du dépôt : monorepo multi-apps ou application unique
**✅ Décidé (2026-08-23)** — Monorepo multi-apps. Détail :
[architecture.md](architecture.md).

**Question** : séparer les 5 modules en applications distinctes (monorepo) ou une
application unique avec routage par rôle ?
**Impact** : isolation du module Livreur (offline-first), complexité de build et de
déploiement, taille des bundles par module. **Qui tranche** : équipe technique. Voir
[architecture.md](architecture.md).

### Q-22 — Volume de commandes cible
**Question** : quel volume de commandes/jour et de pointe doit supporter la
plateforme au lancement et à horizon 1 an ?
**Impact** : dimensionnement de l'hébergement, choix d'architecture de mise à
l'échelle. **Qui tranche** : Direction ChapExpress (données d'activité actuelle) +
équipe technique. Voir
[exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md).

### Q-23 — Durée de rétention des données d'historique
**Question** : combien de temps conserver l'historique des commandes, paiements et
journaux d'action ?
**Impact** : conformité, volumétrie de stockage, capacités d'analyse. **Qui tranche** :
Direction ChapExpress. Voir
[exigences-non-fonctionnelles.md](exigences-non-fonctionnelles.md).

## PWA et hors ligne

### Q-20 — Extension de la file de mutations offline
**✅ Confirmé (2026-08-23)** — Rien à trancher maintenant, sujet revisité après mise
en production sur retour d'usage réel.

**Question** : le module Client (ou d'autres) doit-il aussi bénéficier d'une file de
mutations offline, au-delà du module Livreur ?
**Impact** : complexité technique supplémentaire vs continuité de service en zone de
faible réseau pour les clients. **Qui tranche** : équipe technique, après retour
d'usage post-lancement. Voir [pwa-offline.md](pwa-offline.md).

### Q-21 — Packaging store natif pour une éventuelle V2
**Question** : faut-il empaqueter la PWA (ex. via Capacitor) pour une distribution sur
Google Play / App Store ?
**Impact** : fiabilité des notifications push sur iOS, visibilité store, coût de
maintenance d'un wrapper natif. **Qui tranche** : Direction ChapExpress, après mesure
de l'usage PWA réel. Voir [pwa-offline.md](pwa-offline.md).
