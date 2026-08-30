# ChapExpress

Plateforme de livraison multi-services pour ChapExpress, à Natitingou (Bénin).
Quatre services sous un même point d'entrée : Repas, Colis, Courses express,
Emplettes. Cinq modules : Client, Restaurant, Commerce partenaire, Livreur,
Back-office (admin + dispatching, porté par une seule personne).

Monorepo pnpm en implémentation active. Les **4 services** (Repas, Colis, Emplettes
en mode liste libre, Courses express) sont livrés côté API NestJS/Prisma et côté
apps `client`/`livreur` (phasage retenu : Repas → Colis → Emplettes → Courses
express, voir [docs/decisions-arbitrage.md](docs/decisions-arbitrage.md)) — le
phasage a servi à l'ordre de développement, pas à limiter ce qui est livré.
`apps/partenaires` ne gère que les restaurants (le module Commerce partenaire,
requis pour Emplettes en mode catalogue, est entièrement à faire). L'app `admin`
(back-office) a une vue d'ensemble des commandes, un dispatch (automatique par
rotation + réattribution manuelle) et une gestion des livreurs/zones depuis le
28/08 ; caisse (clôture, rapprochement) et reversement restent à faire — voir
F-ADM-12/13/18. Statut détaillé fonctionnalité par fonctionnalité :
[docs/modules.md](docs/modules.md), tenu à jour à chaque audit — le relire avant
d'affirmer qu'une fonctionnalité existe ou non. Dernier audit :
[docs/audit-chapexpress-2026-08-30.html](docs/audit-chapexpress-2026-08-30.html).

## Stack

Choix tranchés (voir [docs/decisions-arbitrage.md](docs/decisions-arbitrage.md)) :

- React + TypeScript, Vite, PWA installable (service worker + manifest).
- TanStack Query (état serveur) + Zustand (état UI).
- Tailwind CSS + shadcn/ui.
- Offline-first sur le module Livreur : IndexedDB + file de mutations, sync
  différée — **[À FAIRE]**, non implémenté (voir docs/pwa-offline.md et
  docs/modules.md).
- API REST — NestJS + PostgreSQL (Prisma). Monorepo pnpm multi-apps
  (`apps/api`, `apps/client`, `apps/partenaires`, `apps/livreur`, `apps/admin`,
  `packages/config`).
- Temps réel : WebSockets (Socket.IO). Ajouté le 27/08 pour le suivi client
  (F-CLI-05, 4 services) et l'alerte nouvelle commande restaurant (F-RES-01) —
  voir `apps/api/src/realtime/`. Le polling reste en place comme filet de
  secours (reconnexion, 3G instable) ; livreur et back-office non couverts.
- Push : Web Push (VAPID) + fallback WhatsApp/SMS obligatoire — **[À FAIRE]**.
- Paiement : agrégateur Mobile Money, FedaPay (choisi, non intégré — le mode de
  paiement est aujourd'hui seulement enregistré, aucun appel réel à un
  agrégateur).
- Cartographie : Google Maps Platform — **[À FAIRE]**.
- Fichiers : stockage objet compatible S3 — **[À FAIRE]**.

Détail et arbitrages : [docs/architecture.md](docs/architecture.md).

## Commandes du projet

Gestionnaire de paquets : pnpm (workspace `apps/*` + `packages/*`).

```
pnpm install                 # installe tout le monorepo
docker compose up -d db      # PostgreSQL local (postgres:16, voir docker-compose.yml)

pnpm dev                      # lance db + les 5 apps en parallèle (concurrently)
pnpm dev:client               # apps/client   (PWA client)
pnpm dev:partenaires          # apps/partenaires (PWA restaurant/commerce)
pnpm dev:livreur              # apps/livreur  (PWA livreur)
pnpm dev:admin                # apps/admin    (back-office)
pnpm dev:api                  # apps/api      (NestJS, watch mode)

pnpm build                    # build de toutes les apps (apps/**)
pnpm lint                     # lint de toutes les apps (oxlint côté front, eslint côté api)
pnpm typecheck                # typecheck de toutes les apps
```

Dans `apps/api` spécifiquement (non exposé à la racine) :

```
pnpm --filter @delivero/api test          # tests unitaires (Jest)
pnpm --filter @delivero/api test:e2e      # tests e2e
pnpm --filter @delivero/api prisma:migrate  # migration Prisma en dev
pnpm --filter @delivero/api prisma:studio   # Prisma Studio
```

Les 4 apps front (`client`, `partenaires`, `livreur`, `admin`) n'ont pas de script
`test` défini à ce jour — aucune suite de tests front n'existe encore.

## Conventions

- Code et commentaires en anglais ; UI et contenus visibles par l'utilisateur en
  français.
- Composants React en `PascalCase`, un composant par fichier, nom = nom de fichier.
- Dossiers par module (`client/`, `livreur/`, `partenaires/`, `admin/`, `api/`), pas
  par type de fichier. Détail : [docs/architecture.md](docs/architecture.md).
- Routes organisées par rôle authentifié ; aucune route ne mélange deux rôles.
- `type_service` (repas / colis / courses_express / emplettes) est un champ de
  première classe partout où une commande est manipulée.

## 8 règles métier structurantes

- **RG-01** — Paiement Mobile Money ou espèces à la livraison, sur les 4 services.
- **RG-02** — Chaque livreur a un plafond d'avance et de caisse ; le portefeuille
  livreur trace avances, encaissements et solde à reverser.
- **RG-03** — Clôture de caisse journalière par livreur, rapprochement supervisé par
  le dispatcher.
- **RG-04** — Contre-remboursement Colis : le livreur encaisse le destinataire,
  ChapExpress reverse l'expéditeur périodiquement.
- **RG-05** — Emplettes, mode liste libre uniquement : budget maximum obligatoire,
  tout dépassement exige une validation explicite du client. Le mode catalogue
  partenaire a un montant connu à l'avance, pas de budget max.
- **RG-06** — Emplettes : préférence de remplacement par article (équivalent /
  m'appeler / ne pas acheter).
- **RG-07** — Preuve de livraison : OTP/photo/réceptionnaire (Colis), ticket de caisse
  (Emplettes).
- **RG-14** — Attribution automatique par proximité/rotation, sous contrainte du
  plafond d'avance du livreur ; réattribution manuelle possible.

Détail complet : [docs/regles-gestion.md](docs/regles-gestion.md).

## Contraintes locales

- Adressage approximatif : point de repère textuel **obligatoire** + carte en
  complément, jamais l'inverse.
- Connexion 3G instable : budget JS serré (voir
  [docs/exigences-non-fonctionnelles.md](docs/exigences-non-fonctionnelles.md)),
  images compressées avant upload.
- Cash et Mobile Money dominants ; pas de carte bancaire dans le périmètre.
- Restaurants et commerces peu équipés : notification WhatsApp/SMS en fallback sur
  toutes les alertes, pas une option annexe.

## Garde-fous

- Ne jamais coder une règle financière (commission, avance, plafond, reversement)
  sans la vérifier dans `docs/regles-gestion.md` ou `docs/service-*.md` — ce cahier
  des charges n'a pas toujours de valeur chiffrée fixée, voir
  `docs/decisions-ouvertes.md` avant d'inventer un chiffre.
- Un point marqué **[À ARBITRER]** ne se tranche pas seul : demander à l'utilisateur.
- Un point marqué **[DÉDUIT]** est une inférence, pas une exigence confirmée : le
  signaler si le code en dépend de façon sensible.

## Index

| Si je travaille sur... | Lire |
|---|---|
| Le périmètre global, les 4 services, le hors périmètre | [docs/perimetre.md](docs/perimetre.md) |
| Un acteur, un rôle, des permissions | [docs/acteurs.md](docs/acteurs.md) |
| Le service Repas | [docs/service-repas.md](docs/service-repas.md) |
| Le service Colis | [docs/service-colis.md](docs/service-colis.md) |
| Le service Courses express | [docs/service-courses-express.md](docs/service-courses-express.md) |
| Le service Emplettes | [docs/service-emplettes.md](docs/service-emplettes.md) |
| Une fonctionnalité précise (ID F-XXX-NN) | [docs/modules.md](docs/modules.md) |
| Une règle financière ou opérationnelle (RG-NN) | [docs/regles-gestion.md](docs/regles-gestion.md) |
| Le schéma de données, une entité, un statut | [docs/modele-donnees.md](docs/modele-donnees.md) |
| L'architecture, la stack, les intégrations externes | [docs/architecture.md](docs/architecture.md) |
| Le mode hors ligne, le service worker, le module Livreur | [docs/pwa-offline.md](docs/pwa-offline.md) |
| Un budget de perf, une exigence mesurable | [docs/exigences-non-fonctionnelles.md](docs/exigences-non-fonctionnelles.md) |
| Un point non tranché (Q-NN) avant de décider seul | [docs/decisions-ouvertes.md](docs/decisions-ouvertes.md) |
| Le catalogue de lancement Repas (7 restaurants pilotes, REST-NN) | [docs/annexe-a-catalogue-lancement.md](docs/annexe-a-catalogue-lancement.md) |
