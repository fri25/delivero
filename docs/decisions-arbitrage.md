# Plan d'arbitrage

Classement des questions de [decisions-ouvertes.md](decisions-ouvertes.md) (Q-01 à
Q-26) par degré de blocage réel sur le développement, pas par ordre d'importance
métier. Une question peut être très importante pour l'entreprise (ex. taux de
commission) sans bloquer une seule ligne de code si sa valeur peut vivre en
configuration.

**Mise à jour (2026-08-23)** — Les deux questions de catégorie A (Q-06, Q-19) sont
tranchées : NestJS + monorepo multi-apps. Le scaffolding du projet peut démarrer.
En catégorie B, Q-01, Q-07 et Q-09 sont tranchées ; Q-12 est tranchée sur le
principe mais fait naître une sous-question (Q-26, en catégorie C ci-dessous) ; Q-20
(catégorie C) est confirmée. Voir le bandeau **✅** sur chaque entrée concernée.

## A. Bloquant

Impossible d'écrire la première ligne de code sans trancher.

### Q-06 — Choix du backend (NestJS ou Laravel)
**✅ Tranché (2026-08-23)** : NestJS. Motif : TypeScript de bout en bout, types
partageables entre `packages/shared` et l'API sans génération ni duplication, un seul
langage à maintenir sur un projet porté par un effectif réduit. L'alternative Laravel
est écartée ; elle n'est conservée ici qu'à titre de trace de l'arbitrage.

**Qui a tranché** : Développement, validé par Direction ChapExpress.

### Q-19 — Organisation du dépôt : monorepo multi-apps ou application unique
**✅ Décidé (2026-08-23)** : monorepo multi-apps, cohérent avec le choix de NestJS
(Q-06). Détail : [architecture.md](architecture.md).

**Qui tranche** : Développement.
**Ce qu'il faut pour trancher** : le résultat de Q-06 (un backend TypeScript rend un
monorepo à types partagés nettement plus rentable qu'un backend PHP séparé) et la
taille d'équipe prévue (un monorepo suppose une tooling CI/CD plus lourde, à
justifier si l'équipe reste à 1-2 développeurs).
**Recommandation** : monorepo si Q-06 tranche pour NestJS (partage de types
`packages/shared` entre front et back, voir [architecture.md](architecture.md)) ;
dépôt séparé backend/frontend sinon. **[DÉDUIT]**.

## B. Bloquant à terme

Le code peut démarrer si la décision est isolée derrière une abstraction ; le moment
où elle devient réellement bloquante est précisé pour chacune.

### Q-01 — Phasage du développement
**✅ Décidé (2026-08-23)** : **Repas → Colis → Emplettes → Courses express**, sous
réserve que Repas reste bien le service au plus fort volume actuel (sinon, l'ordre se
réévalue — mais Emplettes ne doit jamais passer en premier, risque technique trop
élevé pour un socle non éprouvé). Décision plus précise que la recommandation
initiale ci-dessous. Détail : [perimetre.md](perimetre.md).

**Abstraction** : démarrer par le socle commun valable quel que soit l'ordre retenu
(authentification, carnet d'adresses, squelette back-office, design system) —
aucune de ces briques n'exige que le phasage soit tranché.
**Devient bloquant** : avant de choisir le premier service métier (Repas, Colis,
Courses express ou Emplettes) à développer en profondeur.
**Qui tranche** : Direction ChapExpress, avec recommandation de l'équipe projet.
**Ce qu'il faut pour trancher** : le volume actuel de demandes par service dans le
fonctionnement téléphone/WhatsApp (quel service génère le plus d'activité
aujourd'hui, donc la plus grande valeur à digitaliser en premier).
**Recommandation** : Repas + Colis d'abord, comme dans le cahier des charges v2 —
ce sont les deux services déjà actifs et les mieux documentés, ce qui réduit le
risque de règles manquantes découvertes en cours de route. **[DÉDUIT]** — le cahier
des charges le proposait sous l'ancien phasage Flutter, la logique reste valable
indépendamment du choix technique.

### Q-07 — Choix de l'agrégateur de paiement (FedaPay ou KkiaPay)
**✅ Décidé (2026-08-23)** : FedaPay. Détail : [architecture.md](architecture.md).

**Abstraction** : interface `PaymentGatewayAdapter` (initier un paiement, traiter un
webhook, interroger un statut) implémentée d'abord par un mock, pour développer le
reste du parcours de paiement sans attendre ce choix.
**Devient bloquant** : avant l'intégration réelle du paiement Mobile Money (flux non
mockable au-delà d'un certain stade) et avant toute recette utilisateur impliquant un
paiement réel.
**Qui tranche** : Direction ChapExpress, après test technique des deux options par
le Développement.
**Ce qu'il faut pour trancher** : la grille tarifaire des deux agrégateurs (frais par
transaction MTN MoMo/Moov Money/Celtiis), un test d'intégration réel de chaque SDK/API
par un développeur, un avis sur la fiabilité constatée localement.
**Recommandation** : aucune — décision à prendre sur données de test, pas de biais a
priori entre les deux options.

### Q-09 — Séparation des rôles dispatching / administration
**✅ Décidé (2026-08-23)** : permissions granulaires dès la conception, un seul rôle
`admin_dispatcher` exposé au lancement — conforme à la recommandation ci-dessous.
Détail : [acteurs.md](acteurs.md), [modele-donnees.md](modele-donnees.md).

**Abstraction** : modéliser les autorisations comme une liste de permissions
attribuées au rôle `admin_dispatcher`, plutôt qu'un rôle monolithique câblé en dur —
coût de conception minime, permet d'introduire un second rôle plus tard sans refonte.
**Devient bloquant** : avant qu'une deuxième personne ne rejoive effectivement le
back-office.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : une intention de recrutement ou de partage de la
fonction dispatching à moyen terme (aucun chiffre, juste une décision d'organisation).
**Recommandation** : concevoir le modèle de permissions granulaire dès maintenant même
si un seul rôle est utilisé au lancement — coût quasi nul aujourd'hui, coût élevé en
refonte plus tard. **[DÉDUIT]**.

### Q-12 — Dépassement de budget avec client injoignable (Emplettes, mode liste libre)
**✅ Décidé sur le principe (2026-08-23)** : blocage par défaut, conforme à la
recommandation ci-dessous — mais l'attente doit avoir une fin. La durée du délai
d'attente et le comportement après expiration restent à trancher : voir **Q-26**
(catégorie C ci-dessous), qui hérite de l'abstraction décrite ici.

**Abstraction** : conserver l'état `ValidationDepassement` comme un simple point
d'attente bloquant (voir [modele-donnees.md](modele-donnees.md)), sans coder de
comportement de contournement automatique.
**Devient bloquant** : avant d'activer un comportement automatique de dépassement
(achat partiel dans la limite du budget, poursuite sans validation) — introduire ce
comportement plus tard demande un nouvel état ou une nouvelle branche dans la machine
à états.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : une politique de risque assumée (préférence entre
« la course attend » et « on prend un léger risque de dépassement non validé »).
**Recommandation** : bloquer par défaut (ne jamais dépasser sans validation
explicite), cohérent avec RG-05. **[DÉDUIT]**.

### Q-13 — Règles d'annulation
**Abstraction** : traitement 100 % manuel de toute annulation par le dispatcher
(aucune règle de délai, pénalité ou remboursement automatisée dans le code au
lancement).
**Devient bloquant** : avant d'automatiser un remboursement ou une pénalité calculée
sans intervention humaine.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : la pratique actuelle (les clients annulent-ils
souvent aujourd'hui par téléphone, à quel moment du processus, avec quelle
conséquence financière observée).
**Recommandation** : aucune sans ce retour d'expérience terrain.

### Q-15 — Algorithme d'attribution en cas d'égalité entre livreurs
**Abstraction** : fonction de sélection isolée et interchangeable (ex.
`selectLivreur(candidats)`), pour que la logique de dispatching démarre sans figer le
critère de départage.
**Devient bloquant** : avant la mise en production à un volume où les égalités
deviennent fréquentes (peu probable au lancement avec un petit nombre de livreurs).
**Qui tranche** : Développement, avec retour terrain du dispatcher.
**Ce qu'il faut pour trancher** : rien de chiffré — un test d'usage avec le
dispatcher actuel sur ce qui lui semble équitable.
**Recommandation** : rotation stricte (tourniquet) — la plus simple à auditer et à
expliquer à des livreurs qui contesteraient une attribution. **[DÉDUIT]**.

### Q-17 — État client : TanStack Query + Zustand
**Abstraction** : démarrer avec l'état local React standard (useState/Context) pour
les premiers écrans ; Zustand n'est nécessaire que pour de l'état partagé complexe
(panier, portefeuille livreur hors ligne).
**Devient bloquant** : avant le développement du module Livreur offline-first ou de
tout écran à état partagé riche (ex. panier multi-étapes).
**Qui tranche** : Développement.
**Ce qu'il faut pour trancher** : rien côté métier — confirmation d'équipe technique
uniquement.
**Recommandation** : garder Zustand comme prévu dans la stack — choix réversible à
faible coût, pas de raison de le remettre en cause sans problème rencontré.

### Q-18 — UI kit : Tailwind CSS + shadcn/ui
**Abstraction** : commencer avec les composants shadcn/ui par défaut, sans charte
graphique personnalisée tant qu'elle n'est pas fournie par la direction.
**Devient bloquant** : avant de figer `packages/ui` (le design system partagé entre
les 5 apps, voir [architecture.md](architecture.md)) — changer d'UI kit après que
plusieurs modules l'ont adopté coûte cher en réécriture.
**Qui tranche** : Développement.
**Ce qu'il faut pour trancher** : existe-t-il déjà une charte graphique ou une
identité visuelle ChapExpress imposée par la direction, qui contraindrait le choix ?
**Recommandation** : garder Tailwind + shadcn/ui — vitesse de mise en œuvre, pas
d'argument contraire identifié dans la source.

### Q-22 — Volume de commandes cible
**Abstraction** : déployer sur une infrastructure cloud élastique (scaling
horizontal) sans dimensionnement figé, plutôt qu'un serveur dédié dimensionné pour un
chiffre non confirmé.
**Devient bloquant** : avant la signature d'un contrat d'hébergement fixe et avant le
test de charge de recette.
**Qui tranche** : Direction ChapExpress (données d'activité actuelle) + Développement.
**Ce qu'il faut pour trancher** : le nombre moyen et le pic de demandes traitées par
jour aujourd'hui (tous canaux confondus : téléphone, WhatsApp), et un objectif de
croissance à 1 an fixé par la direction.
**Recommandation** : aucune sans ce chiffre — c'est une donnée d'activité que seule
la direction détient.

### Q-24 — Expéditeur de colis : compte distinct ou rôle contextuel
**Abstraction** : garder le compte Client générique au lancement, sans fermer la
porte à une future entité `CompteEntreprise` reliée en option (voir
[modele-donnees.md](modele-donnees.md)).
**Devient bloquant** : avant de développer le module de facturation entreprise (lié à
Q-16) ou un onboarding dédié aux e-commerçants à fort volume.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : le nombre réel d'e-commerçants/entreprises
identifiés comme prospects pour un compte dédié — donnée liée à Q-16.
**Recommandation** : rôle contextuel du compte Client au lancement — le plus simple,
à revoir seulement si un volume d'e-commerçants le justifie. **[DÉDUIT]**.

## C. Non bloquant

Paramétrable, modifiable à chaud, ou concerne une phase ultérieure.

### Q-02 — Plafonds d'avance et de caisse des livreurs
**Où vit la valeur** : table `Livreur`/`Zone`, modifiable depuis le back-office
(F-ADM-09).
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : la moyenne et le montant maximum réellement avancés
ou encaissés par un livreur aujourd'hui, dans le fonctionnement téléphone/WhatsApp
actuel — pour ne pas fixer un plafond en dessous du besoin réel constaté.
**Recommandation** : aucune sans ce chiffre — ne pas inventer un plafond.

### Q-03 — Taux de commission par partenaire et par service
**Où vit la valeur** : table `Commission` (partenaire × service), modifiable depuis
le back-office (F-ADM-08).
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : les accords informels déjà en place avec les
restaurants/commerces actuels s'il y en a, et à défaut un taux de référence observé
chez des plateformes comparables dans la sous-région.
**Recommandation** : aucune sans donnée de marché ou d'accord existant.

### Q-04 — Périodicité et commission sur le contre-remboursement colis
**Où vit la valeur** : paramètre de configuration back-office (fréquence du job de
reversement) + champ `taux` optionnel sur `Reversement`.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : la fréquence de règlement déjà pratiquée
informellement avec les e-commerçants actuels, si elle existe.
**Recommandation** : hebdomadaire, comme cité en exemple dans le cahier des charges,
à confirmer. **[DÉDUIT]** — c'est un exemple du texte source, pas une valeur validée.

### Q-05 — Responsabilité en cas de perte ou de dommage d'un colis
**Où vit la valeur** : texte des CGU + plafond configurable utilisé par le dispatcher
lors du traitement manuel d'un incident (pas d'automatisation nécessaire au
lancement).
**Qui tranche** : Direction ChapExpress + Juridique-CGU.
**Ce qu'il faut pour trancher** : un avis juridique sur la responsabilité civile
engagée, et, si une assurance tierce est envisagée, un devis d'assurance transport de
marchandises.
**Recommandation** : aucune sans validation juridique — ne pas fixer de plafond de
responsabilité sans avis compétent.

### Q-08 — Modèle de rémunération du livreur
**Où vit la valeur** : nouvelle table de barème (forfait par service/distance ou
pourcentage), modifiable depuis le back-office.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : le revenu moyen actuel d'un livreur dans le
fonctionnement informel (pour ne pas fixer un barème qui le dégrade et fasse fuir les
livreurs).
**Recommandation** : aucune sans ce chiffre.

### Q-10 — Seuils de validation des demandes sensibles
**Où vit la valeur** : table de seuils configurables (valeur colis, dépassement
d'avance, caractère inhabituel d'une commission), modifiable depuis le back-office.
**Qui tranche** : Direction ChapExpress, avec retour d'expérience du dispatcher.
**Ce qu'il faut pour trancher** : ce que le dispatcher actuel considère aujourd'hui
comme une demande « qui mérite un coup de fil de vérification » dans son
fonctionnement manuel.
**Recommandation** : aucune sans ce retour terrain — c'est une intuition métier déjà
présente chez l'opérateur actuel, à faire expliciter plutôt qu'à réinventer.

### Q-11 — Comportement par défaut sans préférence de remplacement (Emplettes)
**Où vit la valeur** : valeur par défaut d'un paramètre back-office, modifiable sans
déploiement.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : rien de chiffré, un choix de politique produit.
**Recommandation** : « ne pas acheter » par défaut — le choix le plus prudent
financièrement, il évite de facturer au client un article qu'il n'a pas explicitement
validé. **[DÉDUIT]**.

### Q-14 — Généralisation du délai de réclamation de 24 h
**Où vit la valeur** : paramètre de configuration par service, modifiable depuis le
back-office.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : rien de chiffré, un choix de cohérence produit.
**Recommandation** : généraliser 24 h à tous les services — une seule règle à
expliquer au client, plus simple à communiquer qu'un délai variable par service.
**[DÉDUIT]**.

### Q-16 — Facturation des clients entreprises
**Où vit la valeur** : fonctionnalité optionnelle activable (flag), indépendante du
reste du périmètre — développable et activée plus tard sans redesign majeur si Q-24
est tranchée dans le sens « rôle contextuel » au départ.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : le nombre réel de prospects « clients entreprises »
identifiés à ce jour — s'il n'y en a aucun, la question ne presse pas.
**Recommandation** : différer à une phase ultérieure en l'absence de demande
confirmée, pour ne pas complexifier le périmètre initial. **[DÉDUIT]**.

### Q-20 — Extension de la file de mutations offline
**✅ Confirmé (2026-08-23)** : rien à trancher maintenant, conforme à la
recommandation ci-dessous.

**Où vit la valeur** : décision de roadmap, pas de valeur à stocker maintenant.
**Qui tranche** : Développement, après retour d'usage post-lancement.
**Ce qu'il faut pour trancher** : des données d'usage réelles (taux de coupures
réseau constatées côté clients) qui n'existent pas avant le lancement.
**Recommandation** : ne rien trancher maintenant, revisiter après mise en production.

### Q-21 — Packaging store natif pour une éventuelle V2
**Où vit la valeur** : décision de roadmap, pas de valeur à stocker maintenant.
**Qui tranche** : Direction ChapExpress, après mesure de l'usage PWA réel.
**Ce qu'il faut pour trancher** : le taux d'installation de la PWA et les retours
utilisateurs sur les limites iOS (voir [pwa-offline.md](pwa-offline.md)), mesurables
seulement après lancement.
**Recommandation** : ne rien trancher maintenant.

### Q-23 — Durée de rétention des données d'historique
**Où vit la valeur** : paramètre d'un job de purge/archivage planifié, modifiable
sans changement de schéma.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : une éventuelle contrainte réglementaire locale sur
la conservation des données (aucune identifiée dans le cahier des charges) et une
politique de rétention souhaitée par la direction.
**Recommandation** : conserver indéfiniment par défaut faute de contrainte connue, en
gardant la purge configurable pour l'ajouter plus tard sans risque. **[DÉDUIT]**.

### Q-25 — Emplettes mode (b) : écart entre prix catalogue et prix réel en caisse
**Où vit la valeur** : seuil configurable dans les règles Emplettes du back-office,
modifiable sans déploiement.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : rien de chiffré a priori — un seuil par défaut à
proposer puis ajuster après les premières commandes réelles.
**Recommandation** : aligner le seuil sur la même logique que le dépassement de
budget du mode (a) (RG-05), par cohérence entre les deux modes — c'est l'option (c)
déjà suggérée dans decisions-ouvertes.md. **[DÉDUIT]**.

### Q-26 — Délai d'attente maximum et comportement après expiration (Emplettes, dépassement de budget)
Née de la décision de principe sur Q-12 (blocage par défaut, mais l'attente doit
avoir une fin).
**Où vit la valeur** : deux paramètres de configuration back-office — la durée du
délai, et le comportement après expiration (choix entre les états déjà existants
dans la machine à états Emplettes : escalade vers `Litige`, ou `Annulee`). Aucun
nouvel état à créer si le comportement choisi est l'un de ceux déjà modélisés (voir
[modele-donnees.md](modele-donnees.md)) — d'où le classement non bloquant malgré le
lien avec Q-12.
**Qui tranche** : Direction ChapExpress.
**Ce qu'il faut pour trancher** : rien de chiffré a priori — une politique de risque
assumée (le dispatcher doit-il être alerté vite, ou la commande doit-elle s'annuler
d'elle-même après un délai plus long ?).
**Recommandation** : délai court (5-10 min) avec escalade vers un incident traité par
le dispatcher plutôt qu'une annulation automatique — laisse une chance de résoudre la
situation par un rappel du dispatcher avant de perdre la vente. **[DÉDUIT]**.

---

## Chemin critique

**✅ Soldé (2026-08-23)**. Questions de catégorie A, dans l'ordre où elles ont été
tranchées :

1. **Q-06 — Choix du backend → NestJS.** Aucune dépendance amont.
2. **Q-19 — Organisation du dépôt → monorepo multi-apps.** Dépendait du résultat de
   Q-06 : NestJS (TypeScript) rend le monorepo à types partagés rentable, cohérent
   avec le choix retenu.

Le scaffolding de projet (package.json, structure de dossiers `apps/`+`packages/`,
CI) peut démarrer sur ces bases. Voir l'arborescence proposée dans
[architecture.md](architecture.md).

## À faire remonter à la direction

**Déjà tranché depuis la première version de ce plan** : l'ordre de lancement des 4
services (Repas → Colis → Emplettes → Courses express, sous réserve de confirmation
par les chiffres d'activité réels — voir point 1 ci-dessous), le prestataire de
paiement Mobile Money (FedaPay), et le principe de permissions granulaires pour le
back-office (un seul rôle exposé au lancement, aucune action requise de la direction).

Liste restante :

1. Combien de commandes/livraisons traite-t-on aujourd'hui par jour en moyenne, et au
   pic, tous canaux confondus (téléphone, WhatsApp) ? Sert à dimensionner
   l'hébergement de la plateforme — et à vérifier que Repas reste bien le service au
   plus fort volume, condition de l'ordre de lancement déjà retenu.
2. Quel plafond d'argent un livreur peut-il avancer pour un achat, et garder en
   caisse avant de le reverser ? Détermine le risque financier pris sur chaque
   livreur.
3. Comment un livreur est-il payé par course (montant fixe, barème selon le service
   ou la distance, pourcentage) ? Détermine le budget d'exploitation et
   l'attractivité du métier pour recruter des livreurs.
4. Quel taux de commission facturer aux restaurants et commerces partenaires, et
   est-ce le même pour tous les services ? Détermine les revenus de ChapExpress et
   l'attractivité de la plateforme pour les partenaires.
5. En cas de colis perdu, cassé ou volé, jusqu'à quel montant ChapExpress
   rembourse-t-elle ? Touche la confiance des clients et doit être écrit dans les
   conditions d'utilisation — à valider avec un juriste avant publication.
6. Quand un colis est payé à la réception (contre-remboursement), à quelle fréquence
   reverse-t-on l'argent à l'expéditeur, et prend-on une commission dessus ? Touche
   la trésorerie des e-commerçants partenaires.
7. À partir de quel montant ou de quelle situation une commande doit-elle être
   validée à la main avant d'être envoyée à un livreur (gros colis, gros budget
   d'achat, demande inhabituelle) ? Détermine la charge de travail quotidienne de la
   personne qui gère le dispatching.
8. Vous avez déjà tranché que le livreur doit attendre une réponse du client en cas
   de dépassement de budget plutôt que de continuer sans validation. Combien de temps
   doit-il attendre avant qu'on considère que ça ne répondra pas, et que se passe-t-il
   alors : on annule la commande, on vous appelle pour trancher, ou on livre ce qui a
   déjà été acheté dans la limite du budget prévu ?
9. Si le livreur constate en caisse un prix différent de celui affiché dans le
   catalogue d'un commerce partenaire (supermarché, pharmacie), qui paie la
   différence, et à partir de quel écart faut-il rappeler le client avant de
   continuer les achats ?
10. En cas d'annulation d'une commande, y a-t-il un délai limite, une pénalité, et le
    remboursement est-il automatique ou décidé au cas par cas ?
11. Un client qui réclame après une livraison a-t-il le même délai de 24 heures pour
    tous les services (repas, colis, courses, achats), ou seulement pour les
    achats comme prévu initialement ?
12. Un client professionnel qui envoie beaucoup de colis (e-commerçant) doit-il avoir
    un compte à part avec des conditions négociées, ou reste-t-il un client comme un
    autre ? Détermine si l'on développe un système de facturation en fin de mois pour
    les entreprises.
13. Combien de temps faut-il garder l'historique des commandes et des paiements ?
