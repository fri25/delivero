# API Colis — contrat des endpoints

Backend uniquement (voir [modules.md](modules.md) F-CLI-15..22, F-LIV-06/07) :
aucun écran n'existe encore côté client/livreur/suivi public. Ce document sert
d'entrée à la passe frontend séparée.

Préfixe global de l'API : `/api`. Toutes les routes ci-dessous sont donc
`/api/commandes/colis/...`.

Modèle : [modele-donnees.md](modele-donnees.md) (entité CommandeColis), machine
à états et règles métier : [service-colis.md](service-colis.md),
[regles-gestion.md](regles-gestion.md) RG-04/RG-07/RG-16.

## Statuts (StatutColis)

```
confirmee → livreur_en_route_enlevement → colis_recupere → en_route → livre
confirmee → annulee
colis_recupere → litige
en_route → litige
```

`litige` est atteignable dans cette itération : déclaré par le livreur, sans
validation/traitement par un dispatcher (aucun back-office). `annulee`
uniquement depuis `confirmee` (avant l'enlèvement).

## Tarification

Provisoire, non validée par la direction (voir `GrilleTarifaireColis` dans
`schema.prisma`) : `tarif = tarifBase(zone) × majoration(taille)`, avec
`majoration` = petit ×1, moyen ×1.5, grand ×2 (constantes en code). Le tarif
est toujours recalculé côté serveur à la création ; tout montant envoyé dans
le payload client est ignoré.

## Addendum — `GET /zones` (ajouté en passe frontend)

Aucun endpoint ne permettait de résoudre le `zoneId` attendu par l'estimation
et la création (voir plus bas) : `Adresse` n'a pas de `zoneId`, et
`GET /restaurants/:id` masque délibérément le sien. Plutôt que de deviner une
zone côté client, un endpoint minimal a été ajouté :

`GET /zones` — public, aucune authentification. Réponse `200` :
`{ id: string; nom: string }[]`, triée par nom. Read-only, pas de logique
métier nouvelle.

## Endpoints client (rôle `client`)

### `GET /commandes/colis/estimation`
Query : `zoneId` (string), `taille` (`petit` \| `moyen` \| `grand`).
Réponse `200` : `{ zoneId, taille, tarif }`.
Erreurs : `404` si aucune grille tarifaire pour cette zone.

### `POST /commandes/colis`
Body :
```jsonc
{
  "adresseEnlevementId": "string",   // doit appartenir au client (carnet d'adresses)
  "zoneId": "string",                // zone de l'adresse d'enlèvement
  "taille": "petit | moyen | grand",
  "destinataireNom": "string",
  "destinataireTelephone": "string",
  "adresseLivraison": "string",
  "pointDeRepereLivraison": "string",
  "latitudeLivraison": "number?",
  "longitudeLivraison": "number?",
  "valeurDeclaree": "number?",
  "fragile": "boolean?",
  "montantContreRemboursement": "number?",   // positif si présent
  "modePaiement": "mobile_money | especes",
  "programmationAt": "string?",       // ISO 8601, doit être dans le futur ; absent = immédiat
  "conditionsAcceptees": true          // doit être exactement `true`
}
```
Réponse `201` : la `CommandeColis` créée (statut `confirmee`), avec `codeOtp`
en clair (uniquement parce que l'appelant est le client propriétaire — voir
plus bas).
Erreurs : `404` adresse introuvable/pas au client, `404` zone sans grille
tarifaire, `400` créneau planifié dans le passé, `400` conditions non
acceptées (validation DTO).

### `GET /commandes/colis/mes-commandes`
Liste des commandes colis du client connecté, plus récentes d'abord. Inclut
`codeOtp`.

### `PATCH /commandes/colis/:id/annuler`
Annule une commande, uniquement depuis le statut `confirmee`. `403` si la
commande n'appartient pas au client. `409` si le statut n'est plus `confirmee`.

## Endpoints livreur (rôle `livreur`)

Tous omettent systématiquement `codeOtp` de la réponse (jamais exposé côté
livreur — voir RG-07 : le code sert à vérifier que le livreur a bien obtenu
l'information du destinataire, pas l'inverse).

### `GET /commandes/colis/disponibles`
Colis `confirmee`, non attribués, dans la zone du livreur connecté, et dont
`programmationAt` est absent ou déjà passé.

### `GET /commandes/colis/mes-courses`
Colis attribués au livreur connecté, tous statuts, plus récents d'abord.

### `PATCH /commandes/colis/:id/prendre-en-charge`
Attribution atomique (`Commande.livreurId` conditionné sur `null` + statut
`confirmee`) : deux prises en charge concurrentes ne peuvent aboutir qu'une
fois. `400` si le livreur n'est pas `disponible`. `409` si zéro ligne
affectée (déjà pris, ou plus au statut `confirmee`). Statut → 
`livreur_en_route_enlevement`.

### `PATCH /commandes/colis/:id/recupere`
Contrôle visuel à l'enlèvement, sans capture photo (aucun stockage de
fichiers S3 intégré). Depuis `livreur_en_route_enlevement` uniquement.
`403` si le colis n'est pas attribué à ce livreur. `409` si mauvais statut.
Statut → `colis_recupere`.

### `PATCH /commandes/colis/:id/en-route`
Depuis `colis_recupere` uniquement. Mêmes erreurs que ci-dessus. Statut →
`en_route`.

### `PATCH /commandes/colis/:id/livraison`
Body :
```jsonc
{
  "codeOtp": "string?",
  "nomReceptionnaire": "string?",
  "montantEncaisse": "number?"
}
```
Au moins un de `codeOtp` / `nomReceptionnaire` est obligatoire (RG-07,
« et/ou »). `montantEncaisse` obligatoire si la commande porte un
`montantContreRemboursement`. Depuis `en_route` uniquement.
Erreurs : `409` mauvais statut, `400` ni code ni nom fournis, `400` code de
remise incorrect (statut inchangé), `400` montant encaissé manquant en cas de
contre-remboursement. Statut → `livre`.

### `PATCH /commandes/colis/:id/litige`
Body : `{ "motif": "string" }`. Depuis `colis_recupere` ou `en_route`
uniquement (`409` sinon). Aucune résolution du litige dans cette itération —
traçabilité seulement (voir RG-12, hors périmètre le traitement par un
dispatcher).

## Endpoint partagé (client, livreur attributaire ou `admin_dispatcher`)

### `GET /commandes/colis/:id`
`404` colis introuvable. `403` si l'appelant n'est ni le client propriétaire,
ni le livreur attributaire, ni `admin_dispatcher`. `codeOtp` uniquement dans
la réponse au client propriétaire ; omis pour livreur/admin.

## Endpoint public (aucune authentification)

### `GET /commandes/colis/suivi/:id`
Suivi par lien public pour le destinataire, sans compte (cahier des charges
§6.2.2). `:id` est le cuid Prisma de la `CommandeColis` (non séquentiel, non
devinable) — pas de token de suivi séparé.

Réponse `200`, liste blanche volontaire (voir `SUIVI_PUBLIC_SELECT` dans
`commandes-colis.service.ts`) :
```jsonc
{ "id": "string", "statut": "StatutColis", "taille": "TailleColis", "fragile": "boolean", "createdAt": "string", "updatedAt": "string" }
```
Jamais : téléphone/adresse du client, adresse d'enlèvement, `codeOtp`,
`montantContreRemboursement`. `404` si l'id n'existe pas.

## Hors périmètre de cette passe (backend)

- Photo à l'enlèvement / à la remise (pas de stockage S3 intégré).
- Validation manuelle des colis de valeur élevée (RG-11, seuil non arbitré,
  pas de back-office).
- Reversement périodique à l'expéditeur (RG-04) et portefeuille livreur
  consolidé (F-LIV-09) : seul `montantEncaisse` est stocké sur la commande.
- Mode invité, envois multiples e-commerçant / import CSV.
- Notifications SMS/WhatsApp du code de remise : affiché en clair au client
  connecté, à relayer manuellement au destinataire.
