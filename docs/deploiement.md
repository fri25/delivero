# Déploiement (pilote, hébergement gratuit)

Choix du 28/10 : **Render** (API + 4 PWA) et **Neon** (PostgreSQL), sans
serveur à administrer ni Docker. Tout est décrit dans
[render.yaml](../render.yaml) (Blueprint Render) : chaque `git push` sur `main`
redéploie ce qui a changé.

| Élément | Hébergement | Offre |
|---|---|---|
| API NestJS | Render, Web Service `chapexpress-api` (Francfort) | Free — veille après ~15 min sans trafic |
| client, livreur, partenaires, admin | Render, 4 Static Sites | Free |
| PostgreSQL | Neon (AWS Francfort) | Free — 0,5 Go |
| Maintien en éveil de l'API | UptimeRobot | Free |

## 1. Base Neon

1. Compte sur neon.tech, *New project*, région **AWS Europe Central
   (Frankfurt)**, PostgreSQL 16.
2. *Connect* : copier la chaîne de connexion **directe** (décocher *Connection
   pooling*, l'hôte ne doit pas contenir `-pooler` — `prisma migrate` en a
   besoin). Elle se termine par `?sslmode=require`.

## 2. Blueprint Render

1. Pousser le dépôt sur GitHub.
2. Compte sur render.com, *New > Blueprint*, choisir le dépôt : Render lit
   `render.yaml` et propose les 5 services.
3. Il demande les variables `sync: false`. Au premier passage, les URL des
   apps ne sont pas encore connues : mettre
   - `DATABASE_URL` : la chaîne Neon ;
   - `VITE_API_URL` (4 apps) : `https://chapexpress-api.onrender.com/api` ;
   - `CORS_ORIGINS` / `CLIENT_APP_URL` : une valeur provisoire, corrigée à
     l'étape 3 ;
   - FedaPay, VAPID, Cloudinary : vides si pas encore prêts (fonctions
     désactivées proprement).

   `JWT_SECRET` est généré par Render.
4. Lancer. L'API applique les migrations Prisma à chaque démarrage
   (`prisma migrate deploy`, sans effet si tout est à jour).

Si un nom de service est déjà pris, Render ajoute un suffixe à l'URL :
reprendre les URL réelles affichées dans le tableau de bord.

## 3. Relier les apps à l'API

Une fois les 4 sites en ligne, dans *chapexpress-api > Environment* :

```
CORS_ORIGINS=https://chapexpress-client.onrender.com,https://chapexpress-livreur.onrender.com,https://chapexpress-partenaires.onrender.com,https://chapexpress-admin.onrender.com
CLIENT_APP_URL=https://chapexpress-client.onrender.com
```

URL exactes, sans `/` final. Enregistrer redémarre l'API.

`VITE_API_URL` est lue **au build** : la changer exige un *Manual Deploy* de
l'app concernée.

## 4. Premier compte back-office

Le seed refuse de tourner en production (comptes démo à mot de passe connu),
et l'offre gratuite de Render n'a pas de terminal. Le compte se crée donc
**depuis le PC de dev**, directement sur la base Neon (PowerShell) :

```powershell
cd apps/api
$env:DATABASE_URL="<chaîne Neon>"
$env:ADMIN_TELEPHONE="+229XXXXXXXX"
$env:ADMIN_MOT_DE_PASSE="<10 caractères minimum>"
$env:ADMIN_NOM="Prénom Nom"
pnpm prisma:bootstrap-admin
```

Le script crée les rôles, les permissions et ce compte `admin_dispatcher`,
rien d'autre. Relançable sans risque : un compte existant n'est pas modifié.
Fermer le terminal ensuite (les variables y restent). Zones, restaurants et
livreurs se créent depuis l'app admin ; les quartiers viennent de la
migration `add_quartiers`.

## 5. Garder l'API éveillée

Sur l'offre gratuite, l'API s'endort après ~15 min sans requête et met 30 à
60 s à repartir : Socket.IO coupé, webhook FedaPay potentiellement perdu.

UptimeRobot (uptimerobot.com) : *New monitor*, type HTTP(s), URL
`https://chapexpress-api.onrender.com/api/health`, intervalle **5 minutes**.
Les ~750 h gratuites mensuelles de Render couvrent une API allumée en continu
— à condition de n'avoir **qu'un seul** Web Service gratuit sur le compte
(les sites statiques ne comptent pas).

## 6. Services externes

- **FedaPay** : webhook `https://chapexpress-api.onrender.com/api/paiements/webhook/fedapay`,
  son secret dans `FEDAPAY_WEBHOOK_SECRET`. Rester en `sandbox` tant que le
  paiement n'a pas été validé de bout en bout.
- **Web Push** : `npx web-push generate-vapid-keys`, une seule fois ; ne plus
  changer les clés ensuite (abonnements existants invalidés).
- **Twilio** : passer `MESSAGERIE_FOURNISSEUR=twilio` et ajouter les
  `TWILIO_*` dans *Environment*. Tant qu'il reste à `console`, les codes OTP
  sont écrits dans les logs de l'API (onglet *Logs*).

## Points à vérifier au premier déploiement

- **IP des clients** (`TRUST_PROXY=1`) : la limite de 60 requêtes/min est par
  IP. Si Render place plus d'un proxy devant l'API, toutes les requêtes
  sembleraient venir de quelques IP et les utilisateurs se feraient bloquer
  (erreurs 429) alors qu'ils sont peu nombreux. En cas de 429 anormaux,
  essayer `TRUST_PROXY=2`.
- **pnpm sur Render** : la version vient de `packageManager` dans
  `package.json`. Si le build échoue faute de pnpm, préfixer les
  `buildCommand` par `corepack enable &&`.

## 7. Sauvegarde, restauration et répétition d'une migration

À faire avant chaque migration de base sensible, en particulier celles du
chantier multi-entreprises ([plan](plan-migration-multi-tenant.md)).

1. **Sauvegarde** depuis le PC (la base Neon de production) :
   `pg_dump -Fc "$PROD_URL" > delivero-$(date +%Y%m%d-%H%M).dump`.
2. **Comptages de référence** :
   `DATABASE_URL="$PROD_URL" pnpm --filter @delivero/api comptages > avant.json`
   (lecture seule).
3. **Copie de répétition** : créer une branche Neon jetable (ou une base
   locale), y restaurer le dump avec
   `pg_restore --no-owner -d "$COPIE_URL" delivero-….dump`, puis
   l'anonymiser : `psql "$COPIE_URL" -v ON_ERROR_STOP=1 -f apps/api/prisma/anonymiser.sql`.
   Le script refuse une base dont le nom évoque la production.
4. **Répétition** sur la copie : comptages, migration
   (`DATABASE_URL="$COPIE_URL" pnpm --filter @delivero/api prisma:deploy`),
   puis `comptages -- --comparer` sur la copie. Code de sortie 1 = une ligne
   ou un montant a disparu : ne pas déployer.
5. **Production** : déployer, puis
   `DATABASE_URL="$PROD_URL" pnpm --filter @delivero/api comptages -- --comparer avant.json`.
6. **Restauration** en cas de problème : restauration à un instant donné de
   Neon (*Branches > Restore*, à l'heure d'avant le déploiement), ou
   `pg_restore --clean --no-owner -d "$PROD_URL" delivero-….dump`, puis
   redéployer la version précédente de l'API.

La restauration doit avoir été **essayée une fois** sur une copie avant la
première migration du chantier, en notant sa durée.

## 8. Rôle de base restreint (sécurité par ligne)

Depuis l'étape 7 du [plan multi-entreprises](plan-migration-multi-tenant.md),
les 22 tables métier portent une politique PostgreSQL `isolation_entreprise` :
une connexion ne voit que les lignes de l'entreprise réglée dans
`app.tenant_id` (posé par l'API à chaque emprunt de connexion). **Un rôle
superutilisateur ou `BYPASSRLS` ignore ces politiques** : c'est le cas du rôle
propriétaire créé par la console Neon (membre de `neon_superuser`). Tant que
l'API s'y connecte, l'extension Prisma reste la seule barrière ; rien ne casse,
la protection supplémentaire est simplement inactive.

Pour l'activer, une fois, depuis le PC (éditeur SQL Neon ou `psql` avec l'URL
du propriétaire) :

```sql
-- Created by SQL, not by the console: no neon_superuser, no BYPASSRLS.
CREATE ROLE rapidliv_app LOGIN PASSWORD '<mot de passe long>'
  NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT USAGE ON SCHEMA public TO rapidliv_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rapidliv_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rapidliv_app;
-- Tables created by later migrations (run as the owner):
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rapidliv_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO rapidliv_app;
```

Puis, sur le service API de Render :

1. `DATABASE_URL_MIGRATIONS` = l'URL actuelle (propriétaire) : les migrations
   du démarrage continuent de tourner avec elle (`prisma.config.ts`).
2. `DATABASE_URL` = la même URL avec `rapidliv_app` et son mot de passe.
3. Redéployer, puis vérifier : connexion back-office, une commande de bout en
   bout, et dans l'éditeur SQL Neon connecté en `rapidliv_app` :
   `SELECT count(*) FROM commandes;` doit renvoyer **0** (aucune entreprise
   réglée).

Les scripts lancés depuis le PC (`comptages`, `seed`, `bootstrap-admin`)
gardent l'URL du propriétaire. Retour arrière : remettre l'ancienne
`DATABASE_URL` (aucune migration à défaire) ; défaire les politiques elles-mêmes :
`prisma/retour-arriere/20261106100000_rls_isolation_entreprise.sql`.

**Limite.** Le rôle de l'API peut lui-même régler `app.plateforme` (lecture
transverse, utilisée par les tâches planifiées et la future app plateforme).
La sécurité par ligne rattrape un filtre oublié ou une requête SQL brute ; elle
ne protège pas d'un attaquant capable d'exécuter du SQL arbitraire avec ce rôle.

## Limites et sortie

- Neon gratuit : 0,5 Go, base suspendue après 5 min d'inactivité (réveil en
  ~1 s, transparent). Sauvegardes : historique de restauration Neon, court sur
  l'offre gratuite — faire aussi un `pg_dump` régulier depuis le PC.
- Machine Render gratuite petite (0,1 CPU, 512 Mo) : suffisante pour le pilote,
  pas pour une charge réelle.
- Le jour où ça ne suffit plus : passer l'API en offre payante Render (même
  configuration), ou migrer vers une VM avec [deploy/](../deploy/)
  (`docker-compose.yml` + Caddy, prêt mais non utilisé) en pointant
  `DATABASE_URL` vers la nouvelle base après un `pg_dump`/`pg_restore`.
