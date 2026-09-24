# ChapExpress

Plateforme de livraison multi-services pour ChapExpress, à Natitingou (Bénin).
Quatre services sous un même point d'entrée : **Repas**, **Colis**, **Courses
express**, **Emplettes**. Cinq modules : Client, Restaurant, Commerce
partenaire, Livreur, Back-office (admin + dispatching).

> Pour le contexte produit complet (périmètre, règles de gestion, statut
> fonctionnalité par fonctionnalité), voir [CLAUDE.md](CLAUDE.md) et le
> dossier [docs/](docs/), en particulier [docs/modules.md](docs/modules.md)
> (tenu à jour à chaque audit).

## Stack

- **Front** : React + TypeScript, Vite, PWA installable (service worker +
  manifest). TanStack Query (état serveur) + Zustand (état UI). Tailwind CSS +
  shadcn/ui.
- **API** : NestJS + PostgreSQL (Prisma).
- **Temps réel** : WebSockets (Socket.IO), avec polling en filet de secours.
- **Monorepo** : pnpm workspace (`apps/*`, `packages/*`).

Détail et arbitrages : [docs/architecture.md](docs/architecture.md) et
[docs/decisions-arbitrage.md](docs/decisions-arbitrage.md).

## Structure du monorepo

```
apps/
  api/           # NestJS + Prisma — API REST + WebSockets
  client/        # PWA client (commande des 4 services)
  partenaires/   # PWA restaurant (Commerce partenaire à venir)
  livreur/       # PWA livreur
  admin/         # Back-office (supervision, dispatch, livreurs, zones)
packages/
  config/        # Configuration partagée (ex. périmètre V1)
```

## Prérequis

- Node.js ≥ 20
- pnpm 10 (`packageManager` défini dans [package.json](package.json))
- Docker (pour PostgreSQL local via `docker compose`)

## Installation

```bash
pnpm install
```

Copier le fichier d'environnement de l'API et l'ajuster si besoin :

```bash
cp apps/api/.env.example apps/api/.env
```

Variables clés (voir les commentaires dans `.env.example` pour le détail) :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (Prisma) |
| `CORS_ORIGINS` | Origines autorisées pour les 4 apps front |
| `SERVICES_ACTIFS` | Services ouverts à la création de commande (périmètre V1) |
| `MODES_PAIEMENT_ACTIFS` | Moyens de paiement acceptés (périmètre V1) |
| `CONTRE_REMBOURSEMENT_ACTIF` | Active le contre-remboursement Colis (RG-04) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Authentification |

## Lancer le projet

```bash
pnpm dev                # démarre la db (docker) + les 5 apps en parallèle
```

Ou individuellement :

```bash
docker compose up -d db  # PostgreSQL local (postgres:16)

pnpm dev:api             # apps/api        — NestJS (watch mode)
pnpm dev:client          # apps/client     — PWA client
pnpm dev:partenaires     # apps/partenaires — PWA restaurant/commerce
pnpm dev:livreur         # apps/livreur    — PWA livreur
pnpm dev:admin           # apps/admin      — back-office
```

### Base de données (Prisma)

Depuis `apps/api` :

```bash
pnpm --filter @delivero/api prisma:migrate   # migration en dev
pnpm --filter @delivero/api prisma:studio    # Prisma Studio
```

## Build, lint, typecheck

```bash
pnpm build       # build de toutes les apps
pnpm lint        # oxlint (front) / eslint (api)
pnpm typecheck   # typecheck de toutes les apps
```

## Tests

Les tests existent uniquement côté API pour le moment (aucune suite front à ce
jour) :

```bash
pnpm --filter @delivero/api test        # tests unitaires (Jest)
pnpm --filter @delivero/api test:e2e    # tests e2e
```

## Conventions

- Code et commentaires en anglais ; UI et contenus visibles par l'utilisateur
  en français.
- Composants React en `PascalCase`, un composant par fichier.
- Dossiers organisés par module (`client/`, `livreur/`, `partenaires/`,
  `admin/`, `api/`), pas par type de fichier.
- `type_service` (repas / colis / courses_express / emplettes) est un champ de
  première classe partout où une commande est manipulée.

Détail complet des conventions et des 8 règles métier structurantes :
[CLAUDE.md](CLAUDE.md).

## Documentation

| Sujet | Fichier |
|---|---|
| Périmètre global, hors périmètre | [docs/perimetre.md](docs/perimetre.md) |
| Acteurs, rôles, permissions | [docs/acteurs.md](docs/acteurs.md) |
| Service Repas | [docs/service-repas.md](docs/service-repas.md) |
| Service Colis | [docs/service-colis.md](docs/service-colis.md) |
| Service Courses express | [docs/service-courses-express.md](docs/service-courses-express.md) |
| Service Emplettes | [docs/service-emplettes.md](docs/service-emplettes.md) |
| Statut par fonctionnalité (F-XXX-NN) | [docs/modules.md](docs/modules.md) |
| Règles de gestion (RG-NN) | [docs/regles-gestion.md](docs/regles-gestion.md) |
| Schéma de données | [docs/modele-donnees.md](docs/modele-donnees.md) |
| Architecture, stack, intégrations | [docs/architecture.md](docs/architecture.md) |
| Mode hors ligne, module Livreur | [docs/pwa-offline.md](docs/pwa-offline.md) |
| Exigences non-fonctionnelles | [docs/exigences-non-fonctionnelles.md](docs/exigences-non-fonctionnelles.md) |
| Points non tranchés (Q-NN) | [docs/decisions-ouvertes.md](docs/decisions-ouvertes.md) |
| Catalogue de lancement Repas | [docs/annexe-a-catalogue-lancement.md](docs/annexe-a-catalogue-lancement.md) |

## Licence

Projet privé — tous droits réservés.
