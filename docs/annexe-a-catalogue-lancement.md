# Annexe A — Catalogue de lancement (service Repas)

Cette annexe recense les sept restaurants partenaires retenus pour la phase pilote du
service Repas à Natitingou. Elle sert de support à trois usages : la saisie initiale
des fiches restaurants dans le back-office, le brief des équipes chargées de
photographier les plats, et la négociation des conventions de partenariat.

Identifiants stables : chaque restaurant est référencé `REST-01` à `REST-07` dans la
suite du document, réutilisables en ticket de saisie back-office.

## A.1 — Objet et périmètre

Le contenu ci-dessous couvre uniquement le service Repas, phase pilote (7
restaurants). Le modèle de fiche restaurant et de fiche plat suit la structure
définie au chapitre technique du cahier des charges (voir
[modele-donnees.md](modele-donnees.md)) : identité et équipement du partenaire,
horaires, délai de préparation, mode de réception des commandes, taux de commission,
contact ; puis, par plat, nom, catégorie, description courte, prix en FCFA,
options/suppléments et disponibilité.

## A.2 — Légende et avertissement sur la nature des données

**Aucune des données chiffrées ou de contact de cette annexe n'est validée.** Seuls
sont réels : le nom des sept restaurants, la liste des huit types de cuisine
utilisables comme filtres de recherche (Cuisine locale, Grillades, Fast-food, Pizza,
Sandwichs & chawarma, Petit-déjeuner, Café & boissons, Pâtisserie), et l'affectation
de chaque restaurant à un ou plusieurs de ces types.

Toutes les autres valeurs — adresse, point de repère, horaires, délai de préparation,
équipement numérique, contact responsable, ainsi que l'intégralité des prix de la
carte — sont **fictives, données à titre d'exemple de structuration**. Chaque fiche
porte la mention **(FICTIF)** en pied de tableau pour le rappeler. Aucune de ces
valeurs ne doit être saisie en base de production avant vérification sur le terrain
(voir checklist §A.7).

**Exception : le taux de commission.** Depuis la décision du 2026-08-25 (voir
[regles-gestion.md](regles-gestion.md) RG-08), la commission Repas est **un taux
unique de 15 %, réellement décidé**, identique pour les sept restaurants — ce n'est
plus un champ négocié par partenaire ni marqué FICTIF. Elle est en outre désormais
calculée sur (prix des plats + frais de livraison) et facturée au client, le
restaurant étant reversé plein tarif ; ce n'est donc plus, à proprement parler, une
retenue « à saisir » sur la fiche restaurant (voir §A.5).

Les coordonnées GPS ne figurent dans aucune fiche : elles n'ont pas été fournies et
doivent être relevées sur place, elles ne sont donc pas marquées FICTIF mais
**non renseignées**.

Les descriptions courtes de plat, requises par le modèle de données, ne sont pas
rédigées à ce stade (seuls les noms et prix ont été communiqués) : elles restent à
produire avec chaque partenaire, idéalement au moment de la prise de photo (voir
§A.7).

## A.3 — Fiches partenaires

### REST-01 — Chez Guillaume

| Champ | Valeur |
|---|---|
| Types de cuisine | Pâtisserie, Petit-déjeuner |
| Spécialité | Pâtisserie |
| Adresse | Quartier Yimporima, près du carrefour du marché central, Natitingou |
| Point de repère | En face de la station-service, immeuble à façade jaune |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Lundi–samedi 6h30–19h00 ; dimanche 7h00–13h00 |
| Délai de préparation moyen | 10 min |
| Mode de réception des commandes | Interface web |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | M. Guillaume A. — +229 01 XX XX XX 01 |

*Adresse, point de repère, horaires, délai, équipement, contact : FICTIF.*

**Menu**

Viennoiseries & pâtisseries

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Croissant | 300 | — | Disponible |
| Pain au chocolat | 350 | — | Disponible |
| Gâteau à la part | 500 | — | Disponible |
| Beignets sucrés (x5) | 250 | — | Disponible |
| Cake maison | 600 | — | Disponible |
| Gâteau d'anniversaire sur commande | À partir de 8 000 | Commande à passer 24 h à l'avance — **traitement particulier requis dans le parcours de commande, voir §A.5** | Sur commande uniquement |

Boissons

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Jus locaux (bissap / gingembre) | 500 | — | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

### REST-02 — Okoti Saveurs

| Champ | Valeur |
|---|---|
| Types de cuisine | Cuisine locale, Grillades |
| Spécialité | Viande de brousse |
| Adresse | Route de Kouandé, quartier Peporiyakou, Natitingou |
| Point de repère | À 200 m après le pont, côté droit en venant du centre |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Tous les jours 11h00–22h30 |
| Délai de préparation moyen | 30 min |
| Mode de réception des commandes | Canal de secours WhatsApp/SMS |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | Mme Okoti — +229 01 XX XX XX 02 |

*Adresse, point de repère, horaires, délai, équipement, contact : FICTIF.*

**Menu**

Grillades (viande de brousse)

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Agouti braisé | 3 500 | Accompagnement au choix (voir ci-dessous) | Disponible |
| Biche sauce arachide | 4 000 | Accompagnement au choix (voir ci-dessous) | Disponible |
| Pintade braisée | 3 000 | Accompagnement au choix (voir ci-dessous) | Disponible |
| Lapin sauce tomate | 2 500 | Accompagnement au choix (voir ci-dessous) | Disponible |

Accompagnements (au choix, un par commande de grillade)

| Option | Prix (FCFA) |
|---|---|
| Riz | 500 |
| Igname pilée | 500 |
| Pâte rouge | 500 |
| Frites | 500 |

Suppléments

| Option | Prix (FCFA) |
|---|---|
| Piment | 200 |
| Akpan | 200 |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2. Le
détail exact de la relation « accompagnement inclus ou en supplément » avec le plat
principal est à confirmer avec la partenaire.*

### REST-03 — John Café

| Champ | Valeur |
|---|---|
| Types de cuisine | Café & boissons, Petit-déjeuner, Sandwichs & chawarma |
| Spécialité | Cafés et thés infusés au moringa, sandwichs, petits-déjeuners |
| Adresse | Avenue de l'Indépendance, centre-ville de Natitingou |
| Point de repère | À côté de la pharmacie, terrasse bleue |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Lundi–samedi 6h00–20h00 ; dimanche fermé |
| Délai de préparation moyen | 12 min |
| Mode de réception des commandes | Interface web |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | M. John K. — +229 01 XX XX XX 03 |

*Adresse, point de repère, horaires, délai, équipement, contact : FICTIF.*

**Menu**

Boissons chaudes

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Café moringa | 700 | — | Disponible |
| Thé moringa-citron | 600 | — | Disponible |
| Café au lait | 800 | — | Disponible |
| Chocolat chaud | 900 | — | Disponible |

Formule petit-déjeuner

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Formule complète (boisson + omelette + pain) | 1 800 | — | Disponible |

Sandwichs

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Sandwich thon | 1 200 | — | Disponible |
| Sandwich poulet | 1 500 | — | Disponible |
| Croque-monsieur | 1 300 | — | Disponible |

Boissons fraîches

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Smoothie moringa-ananas | 1 200 | — | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

**Note commerciale à usage de négociation uniquement** (ne concerne pas la
présentation client dans le back-office) : positionnement différenciant sur le
moringa et créneau petit-déjeuner 6h–10h, à évoquer dans la convention de
partenariat. Ne pas transposer en langage marketing dans les fiches back-office.

### REST-04 — Le Bélier

| Champ | Valeur |
|---|---|
| Types de cuisine | Cuisine locale, Fast-food, Pizza |
| Spécialités | Igname pilée (sauce arachide et fromage peul), tête de mouton façon Bélier ; également pizzas et chawarmas |
| Adresse | Quartier Tchirimina, Natitingou |
| Point de repère | Près du stade municipal, enseigne rouge |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Tous les jours 10h00–23h00 |
| Délai de préparation moyen | 25 min (45 min pour la tête de mouton) |
| Mode de réception des commandes | Interface web |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | M. Idrissou B. — +229 01 XX XX XX 04 |

*Adresse, point de repère, horaires, délai, équipement, contact : FICTIF.*

**Menu**

Cuisine locale

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Igname pilée sauce arachide + fromage peul | 2 500 | — | Disponible |
| Tête de mouton façon Bélier | 4 500 | Sur commande, délai 45 min — **traitement particulier requis dans le parcours de commande, voir §A.5** | Sur commande uniquement |
| Pâte noire sauce légume | 1 500 | — | Disponible |

Pizzas

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Pizza margherita | 3 500 | — | Disponible |
| Pizza poulet | 4 500 | — | Disponible |
| Pizza complète | 5 500 | — | Disponible |

Chawarmas

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Chawarma poulet | 1 800 | — | Disponible |
| Chawarma viande | 2 000 | — | Disponible |

Accompagnements & boissons

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Frites | 700 | — | Disponible |
| Boissons | 500 – 1 000 | Gamme à détailler par référence (voir checklist §A.7) | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

### REST-05 — Mini Kota

| Champ | Valeur |
|---|---|
| Types de cuisine | Grillades, Cuisine locale, Fast-food |
| Spécialité | Maquis-grill — poulet braisé, poisson braisé, brochettes |
| Adresse | Quartier Santa, Natitingou |
| Point de repère | Carrefour Santa, sous les manguiers |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Mardi–dimanche 17h00–00h00 ; lundi fermé |
| Délai de préparation moyen | 35 min |
| Mode de réception des commandes | Canal de secours WhatsApp/SMS |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | M. Kota — +229 01 XX XX XX 05 |

*Types de cuisine, spécialité, adresse, point de repère, horaires, délai, équipement,
contact : FICTIF (fiche entièrement supposée, aucune donnée réelle communiquée pour
ce partenaire hormis le nom).*

**Menu**

Grillades

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Demi-poulet braisé | 2 800 | — | Disponible |
| Poulet entier braisé | 5 000 | — | Disponible |
| Poisson tilapia braisé | 2 500 | — | Disponible |
| Brochettes de bœuf (x3) | 1 500 | — | Disponible |

Accompagnements

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Attiéké | 500 | — | Disponible |
| Alloco | 700 | — | Disponible |
| Frites | 700 | — | Disponible |
| Salade fraîche | 500 | — | Disponible |

Boissons

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Boissons | 500 – 1 000 | Gamme à détailler par référence (voir checklist §A.7) | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

### REST-06 — Jardin de l'Atacora

| Champ | Valeur |
|---|---|
| Types de cuisine | Cuisine locale, Grillades, Fast-food |
| Spécialité | Restaurant de jardin — cuisine africaine et plats internationaux, cadre verdoyant |
| Adresse | Route de la Chute de Kota, sortie sud de Natitingou |
| Point de repère | Grand portail vert, 500 m après l'hôtel |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Tous les jours 11h00–23h00 |
| Délai de préparation moyen | 30 min |
| Mode de réception des commandes | Interface web |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | Mme Adjovi — +229 01 XX XX XX 06 |

*Types de cuisine, spécialité, adresse, point de repère, horaires, délai, équipement,
contact : FICTIF (fiche entièrement supposée, aucune donnée réelle
communiquée pour ce partenaire hormis le nom).*

**Menu**

Plats principaux

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Poulet DG | 3 500 | — | Disponible |
| Riz sauté aux crevettes | 3 000 | — | Disponible |
| Spaghetti bolognaise | 2 200 | — | Disponible |
| Steak-frites | 3 800 | — | Disponible |
| Poisson braisé complet | 3 200 | — | Disponible |
| Igname frite + viande | 2 000 | — | Disponible |
| Plat du jour | 2 000 | Composition variable selon le jour — à définir avec le partenaire | Disponible |

Accompagnements & boissons

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Salade composée | 1 500 | — | Disponible |
| Jus naturels | 800 | — | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

### REST-07 — Les Délices d'Angèle

| Champ | Valeur |
|---|---|
| Types de cuisine | Cuisine locale, Fast-food, Sandwichs & chawarma |
| Spécialités | Riz, spaghetti, chawarma, panini |
| Adresse | Quartier Ourbouga, Natitingou |
| Point de repère | À 100 m du collège, kiosque bleu et blanc |
| Coordonnées GPS | Non renseignées — à relever sur le terrain |
| Horaires | Lundi–samedi 10h00–21h00 ; dimanche 12h00–20h00 |
| Délai de préparation moyen | 20 min |
| Mode de réception des commandes | Canal de secours WhatsApp/SMS |
| Taux de commission | 15 % (taux unique Repas, décidé le 2026-08-25 — voir RG-08) |
| Contact responsable | Mme Angèle D. — +229 01 XX XX XX 07 |

*Adresse, point de repère, horaires, délai, équipement, contact : FICTIF.*

Note de saisie : « Plats du jour » cité dans les données sources comme type de
cuisine n'appartient pas à la liste des huit types de cuisine retenus comme filtres
(§A.2). Ce partenaire est classé dans le filtre **Cuisine locale**, ses plats du jour
étant traités comme une catégorie de menu (voir ci-dessous) et non comme un type de
cuisine.

**Menu**

Riz & pâtes

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Riz sauce tomate + viande | 1 500 | — | Disponible |
| Riz gras | 1 800 | — | Disponible |
| Spaghetti sauce viande | 1 500 | — | Disponible |
| Spaghetti aux œufs | 1 200 | — | Disponible |

Sandwichs & chawarma

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Chawarma poulet | 1 800 | — | Disponible |
| Chawarma viande | 2 000 | — | Disponible |
| Panini poulet | 1 500 | — | Disponible |
| Panini fromage | 1 200 | — | Disponible |

Accompagnements & boissons

| Plat | Prix (FCFA) | Options / suppléments | Disponibilité |
|---|---|---|---|
| Frites | 700 | — | Disponible |
| Boissons | 500 | — | Disponible |

*Tous les prix ci-dessus : FICTIF. Descriptions courtes à rédiger — voir §A.2.*

## A.4 — Tableau récapitulatif des partenaires pilotes

| Réf. | Nom | Types de cuisine | Plage horaire | Délai moyen | Mode de réception | Commission | Plats au catalogue |
|---|---|---|---|---|---|---|---|
| REST-01 | Chez Guillaume | Pâtisserie, Petit-déjeuner | Lun–sam 6h30–19h00 ; dim 7h00–13h00 | 10 min | Interface web | 15 % | 7 |
| REST-02 | Okoti Saveurs | Cuisine locale, Grillades | Tous les jours 11h00–22h30 | 30 min | Canal de secours WhatsApp/SMS | 15 % | 10 |
| REST-03 | John Café | Café & boissons, Petit-déjeuner, Sandwichs & chawarma | Lun–sam 6h00–20h00 ; dim fermé | 12 min | Interface web | 15 % | 9 |
| REST-04 | Le Bélier | Cuisine locale, Fast-food, Pizza | Tous les jours 10h00–23h00 | 25 min (45 min tête de mouton) | Interface web | 15 % | 10 |
| REST-05 | Mini Kota | Grillades, Cuisine locale, Fast-food | Mar–dim 17h00–00h00 ; lun fermé | 35 min | Canal de secours WhatsApp/SMS | 15 % | 9 |
| REST-06 | Jardin de l'Atacora | Cuisine locale, Grillades, Fast-food | Tous les jours 11h00–23h00 | 30 min | Interface web | 15 % | 9 |
| REST-07 | Les Délices d'Angèle | Cuisine locale, Fast-food, Sandwichs & chawarma | Lun–sam 10h00–21h00 ; dim 12h00–20h00 | 20 min | Canal de secours WhatsApp/SMS | 15 % | 10 |

Total : 7 partenaires, 64 lignes de menu (plats, accompagnements, suppléments et
boissons confondus).

*Colonne « Commission » : décidée (15 % uniforme, voir §A.2 et RG-08), identique
quel que soit le mode de réception. Toutes les autres colonnes hors « Réf. » et
« Nom » : FICTIF, à confirmer (voir §A.6).*

## A.5 — Points nécessitant un arbitrage de la direction

- ~~**Écart de taux de commission (12 % / 15 %) corrélé au mode de réception des
  commandes.**~~ **Tranché le 2026-08-25** — la commission Repas est un taux
  unique de 15 %, identique pour tous les partenaires quel que soit leur mode de
  réception des commandes ; l'écart observé dans une version précédente de ce
  catalogue pilote n'a donc plus lieu d'être. Voir
  [decisions-ouvertes.md](decisions-ouvertes.md) Q-03 et
  [regles-gestion.md](regles-gestion.md) RG-08. Reste ouvert : l'extension ou non
  de ce modèle (frais séparés + commission côté client) aux autres services
  (Colis, Courses express, Emplettes mode catalogue).
- **Barème des frais de livraison par zone, non représenté dans ce catalogue.** La
  grille décidée (500 FCFA en zone centre-ville, 1 000 FCFA en zone plus éloignée
  — voir RG-08) s'applique au niveau de la commande, pas de la fiche restaurant :
  aucune colonne de ce catalogue ne la porte. La définition exacte de la limite
  entre les deux zones reste ouverte — voir
  [decisions-ouvertes.md](decisions-ouvertes.md) Q-28.
- **Plats à délai de préparation long ou vendus uniquement sur commande** : tête de
  mouton façon Bélier (REST-04, 45 min, sur commande) et gâteau d'anniversaire Chez
  Guillaume (REST-01, à partir de 8 000 F, commande 24 h à l'avance). Le parcours de
  commande standard décrit dans [service-repas.md](service-repas.md) suppose un
  délai de préparation homogène affiché au client et une acceptation ou un refus du
  restaurant dans un délai imparti court ; il n'est pas conçu pour un délai de
  préparation de plusieurs heures ni pour une commande passée la veille. Un
  traitement distinct (créneau de retrait différé, confirmation anticipée du
  restaurant, exclusion de l'attribution automatique immédiate d'un livreur) doit
  être défini avant l'ouverture de ces deux fiches au catalogue actif. Une nouvelle
  entrée **Q-27** a été ajoutée à
  [decisions-ouvertes.md](decisions-ouvertes.md) pour assurer le suivi de cet
  arbitrage.
- **Fiches REST-05 et REST-06** : aucune donnée réelle n'a été communiquée pour ces
  deux partenaires en dehors du nom (types de cuisine, spécialité, adresse et menu
  entièrement supposés à titre d'exemple de structuration). Confirmer avec la
  direction que ces deux établissements sont bien candidats pilotes avant tout
  contact terrain sur la base de cette fiche.
- **Restaurant classé « Plats du jour »** (REST-07, voir note de saisie en §A.3) :
  confirmer que la liste des huit types de cuisine filtrables reste fermée, ou
  qu'elle doit être complétée.

## A.6 — Données à confirmer avant mise en production

Pour chaque restaurant, l'ensemble des champs suivants est fictif et doit être
vérifié sur le terrain avant toute saisie définitive en base (voir checklist §A.7).
Le taux de commission (15 %, voir §A.2) n'en fait plus partie : il est décidé et
identique pour les sept restaurants.

- **REST-01 — Chez Guillaume** : adresse, point de repère, coordonnées GPS (non
  renseignées), horaires, délai de préparation, mode de réception, contact
  responsable, les 7 lignes de menu (noms, prix, description courte à rédiger,
  conditions de la commande de gâteau d'anniversaire).
- **REST-02 — Okoti Saveurs** : adresse, point de repère, coordonnées GPS (non
  renseignées), horaires, délai de préparation, mode de réception, contact
  responsable, les 10 lignes de menu (dont la règle exacte d'inclusion ou de
  facturation de l'accompagnement).
- **REST-03 — John Café** : adresse, point de repère, coordonnées GPS (non
  renseignées), horaires, délai de préparation, mode de réception, contact
  responsable, les 9 lignes de menu.
- **REST-04 — Le Bélier** : adresse, point de repère, coordonnées GPS (non
  renseignées), horaires, délai de préparation (y compris le délai spécifique de la
  tête de mouton), mode de réception, contact responsable, les 10 lignes de menu,
  détail des références de boissons.
- **REST-05 — Mini Kota** : types de cuisine, spécialité, adresse, point de repère,
  coordonnées GPS (non renseignées), horaires, délai de préparation, mode de
  réception, contact responsable, les 9 lignes de menu — fiche entièrement à
  valider, aucune donnée réelle de départ.
- **REST-06 — Jardin de l'Atacora** : types de cuisine, spécialité, adresse, point de
  repère, coordonnées GPS (non renseignées), horaires, délai de préparation, mode de
  réception, contact responsable, les 9 lignes de menu (dont la composition réelle
  du « plat du jour ») — fiche entièrement à valider, aucune donnée réelle de
  départ.
- **REST-07 — Les Délices d'Angèle** : adresse, point de repère, coordonnées GPS (non
  renseignées), horaires, délai de préparation, mode de réception, contact
  responsable, les 10 lignes de menu.

Pour les sept fiches, les descriptions courtes de plat ne sont rédigées pour aucune
ligne de menu : elles restent entièrement à produire sur le terrain.

## A.7 — Checklist de collecte terrain (réutilisable pour l'intégration de futurs partenaires)

**Identité et statut du partenaire**
- [ ] Nom commercial exact du restaurant, orthographe confirmée avec le responsable.
- [ ] Type(s) de cuisine à cocher parmi la liste fermée des huit filtres (§A.2), ou
      signalement d'un besoin de filtre supplémentaire à faire remonter à la
      direction.
- [ ] Contact responsable : nom, fonction, numéro de téléphone joignable, second
      numéro de secours.

**Localisation**
- [ ] Adresse rédigée telle qu'un livreur la comprendrait localement.
- [ ] Point de repère textuel obligatoire, formulé indépendamment de la carte (voir
      contrainte d'adressage approximatif du cahier des charges).
- [ ] Coordonnées GPS relevées sur place (smartphone en position devant
      l'établissement), jamais reportées depuis une carte en ligne à distance.

**Fonctionnement**
- [ ] Horaires réels jour par jour, y compris jours de fermeture et horaires
      dérogatoires (jours fériés, ramadan, etc. si applicable).
- [ ] Délai de préparation moyen mesuré ou estimé par le responsable, par plat si le
      délai varie fortement (cas des plats sur commande).
- [ ] Mode de réception des commandes : test réel de l'Interface web avec un compte
      pilote si le restaurant est équipé, sinon confirmation du canal de secours
      WhatsApp/SMS et du numéro dédié.
- [ ] Repérage des plats à délai long ou vendus sur commande uniquement : délai
      exact, préavis minimum, conditions d'annulation.

**Carte**
- [ ] Liste complète des plats avec nom officiel, catégorie, prix en FCFA à jour.
- [ ] Description courte de chaque plat, rédigée avec le responsable, registre sobre
      sans langage marketing.
- [ ] Options et suppléments réels par plat (accompagnements au choix, suppléments
      payants), avec règle d'inclusion ou de facturation.
- [ ] Photo de chaque plat dans des conditions de prise de vue standardisées
      (lumière naturelle, fond neutre, angle constant) ; plat identifié par son nom
      exact au moment de la prise de vue pour éviter toute confusion à l'import.
- [ ] Disponibilité habituelle de chaque plat (quotidienne, certains jours
      seulement, saisonnière).

**Contractualisation**
- [ ] Pour Repas : taux de commission de 15 % rappelé au partenaire comme non
      négociable (taux unique décidé, voir RG-08) — sauf évolution ultérieure de la
      politique tarifaire. Pour un autre service encore au modèle par défaut : taux
      négocié, validé par la direction avant signature.
- [ ] Périodicité et moyen de reversement (Mobile Money) confirmés avec le
      partenaire — le partenaire Repas est reversé plein tarif sur ses ventes
      (commission et frais de livraison ne sont plus déduits de son reversement).
- [ ] Convention de partenariat signée par le responsable habilité.
- [ ] Fiche back-office créée et vérifiée par une seconde personne avant activation
      du restaurant au catalogue actif.
