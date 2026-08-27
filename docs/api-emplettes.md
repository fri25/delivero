# API Emplettes (mode liste libre) — contrat des endpoints

Backend uniquement, mode **liste libre** seulement (voir
[modules.md](modules.md) F-CLI-28, F-CLI-30 à 35, F-CLI-37, F-LIV-04). Le mode
catalogue partenaire, et le module Commerce partenaire qu'il suppose, font
l'objet d'une passe séparée. Aucun écran n'existe encore.

Préfixe global de l'API : `/api`. Toutes les routes ci-dessous sont donc
`/api/commandes/emplettes/...`.

Modèle : [modele-donnees.md](modele-donnees.md) (entités CommandeEmplettes,
ArticleEmplette), machine à états et règles métier :
[service-emplettes.md](service-emplettes.md),
[regles-gestion.md](regles-gestion.md) RG-02, RG-05, RG-06, RG-07.

## Statuts (StatutEmplettes)

```
confirmee → achats_en_cours → achats_termines → en_route → livree
achats_en_cours → validation_depassement → achats_en_cours (client accepte)
achats_en_cours → validation_depassement → annulee (client refuse)
confirmee → annulee
achats_en_cours → litige
```

`litige` est atteignable dans cette itération : déclaré par le livreur, sans
validation/traitement par un dispatcher (aucun back-office). `annulee`
uniquement depuis `confirmee` (avant le début des achats) ou depuis
`validation_depassement` (refus du client).

## Tarification

Deux composantes, toutes deux provisoires et non validées par la direction :
`fraisLivraison` (réutilise `Zone.fraisLivraison`, comme Colis/Repas) et
`fraisService` = 10 % du montant réel des achats (constante en code,
`FRAIS_SERVICE_POURCENTAGE`, voir `commandes-emplettes.service.ts`). Le
montant des achats (`sousTotal`, `montantReel`) n'est connu qu'après le
pointage des articles par le livreur — voir "Décompte final" plus bas.

## Endpoints client (rôle `client`)

### `GET /commandes/emplettes/estimation`
Query : `zoneId` (string), `budgetMax` (number). Réponse `200` :
`{ zoneId, budgetMax, fraisLivraison, fraisServiceEstime, totalEstime }`.

### `POST /commandes/emplettes`
Body :
```jsonc
{
  "mode": "liste_libre",              // "catalogue" est rejeté (400 explicite)
  "zoneId": "string",
  "adresseId": "string",              // adresse du client (carnet d'adresses), livraison
  "lieuAchat": "string?",             // texte libre, ex. "Marché central"
  "budgetMax": "number",              // positif, obligatoire (RG-05)
  "modeFinancement": "mobile_money_anticipe | especes_livraison | avance_livreur",
  "articles": [
    { "libelle": "string", "preferenceRemplacement": "equivalent | appeler | ne_pas_acheter?" }
  ]
}
```
`preferenceRemplacement` par défaut : `ne_pas_acheter` (Q-11, [DÉDUIT]).
Réponse `201` : la `CommandeEmplettes` créée (statut `confirmee`),
`commande.montantTotal` = **estimation** (`budgetMax + fraisLivraison +
10 % de budgetMax`), `commande.sousTotal` = `null` (montant réel inconnu).
Erreurs : `400` si mode ≠ liste_libre, `404` adresse/zone introuvables.

### `GET /commandes/emplettes/mes-commandes`
Liste des commandes emplettes du client connecté, plus récentes d'abord.

### `PATCH /commandes/emplettes/:id/valider-depassement`
Body : `{ "accepter": boolean }`. Depuis `validation_depassement`
uniquement (`409` sinon). `accepter: true` → reprise des achats
(`achats_en_cours`) ; `false` → `annulee`. `403` si la commande n'appartient
pas au client.

**Non implémenté (voir hors périmètre)** : le délai d'attente maximum et
l'escalade automatique après expiration (Q-26) — pas de tâche planifiée dans
ce projet, blocage indéfini en attendant l'action du client.

### `PATCH /commandes/emplettes/:id/annuler`
Depuis `confirmee` uniquement (avant le début des achats). `403` si la
commande n'appartient pas au client. `409` si le statut ne le permet plus.

## Endpoints livreur (rôle `livreur`)

### `GET /commandes/emplettes/disponibles`
Commandes `confirmee`, non attribuées, dans la zone du livreur connecté.

### `GET /commandes/emplettes/mes-courses`
Commandes attribuées au livreur connecté, tous statuts, plus récentes
d'abord.

### `PATCH /commandes/emplettes/:id/prendre-en-charge`
Attribution atomique, même garantie que Colis (`Commande.livreurId`
conditionné sur `null` + statut `confirmee`). `400` si le livreur n'est pas
`disponible`. `409` si zéro ligne affectée. Statut → `achats_en_cours`
directement (pas d'étape intermédiaire, contrairement à Colis — voir la
machine à états).

### `PATCH /commandes/emplettes/:id/articles/:articleId/pointer`
Body :
```jsonc
{
  "statut": "achete | indisponible | remplace",
  "prixReel": "number?",                    // obligatoire si achete/remplace
  "produitRemplacementLibelle": "string?"   // obligatoire si remplace
}
```
Depuis `achats_en_cours` uniquement (`409` sinon — bloque tout pointage
pendant une `validation_depassement`). Recalcule `montantReel` (somme des
articles achetés/remplacés) après chaque pointage ; si `montantReel` dépasse
`budgetMax`, bascule automatiquement en `validation_depassement` (RG-05,
Q-12). Erreurs : `403` si le livreur n'est pas l'attributaire, `404` si
l'article n'appartient pas à cette commande, `400` si prix réel/produit de
remplacement manquant selon le statut demandé.

### `PATCH /commandes/emplettes/:id/achats-termines`
Body : `{ "recapitulatifAchats": "string" }` (obligatoire — substitut texte à
la photo du ticket, RG-07, aucun stockage S3). Depuis `achats_en_cours`
uniquement, et seulement si aucun article ne reste `en_attente` (`400`
sinon). Recalcule et fige le décompte final : `sousTotal` = montant réel,
`commission` = 10 % du montant réel, `montantTotal` = sousTotal +
fraisLivraison + commission. Statut → `achats_termines`.

### `PATCH /commandes/emplettes/:id/en-route`
Depuis `achats_termines` uniquement.

### `PATCH /commandes/emplettes/:id/livree`
Depuis `en_route` uniquement.

### `PATCH /commandes/emplettes/:id/litige`
Body : `{ "motif": "string" }`. Depuis `achats_en_cours` uniquement (seule
transition présente dans la machine à états de service-emplettes.md).

## Endpoint partagé (client, livreur attributaire ou `admin_dispatcher`)

### `GET /commandes/emplettes/:id`
`404` introuvable. `403` si l'appelant n'est ni le client propriétaire, ni
le livreur attributaire, ni `admin_dispatcher`.

## Hors périmètre de cette passe (backend)

- Mode catalogue partenaire et le module Commerce partenaire qu'il suppose.
- Toute capture ou upload de photo (aucun stockage S3 intégré) — le
  récapitulatif d'achat et le remplacement d'article sont textuels.
- Timeout automatique du dépassement de budget (Q-26 non arbitré fermement) :
  blocage indéfini tant que le client n'a pas répondu, pas d'escalade
  planifiée.
- Portefeuille livreur consolidé (F-LIV-09) et régularisation financière
  réelle (complément à payer / trop-perçu, intégration agrégateur) :
  `montantReel` et l'écart avec `budgetMax` sont exposés, rien de plus.
- Validation manuelle des commandes dépassant le plafond d'avance normal
  (RG-11) : seuil non arbitré, aucun back-office pour la traiter.
- Appel client intégré (F-LIV-05) : `commande.client.telephone` est inclus
  dans la réponse livreur, un lien `tel:` se construit côté frontend, pas
  d'endpoint dédié.
- Mode invité : compte client connecté exigé, cohérence avec Repas/Colis.

## Correctif appliqué en cours de cette passe

Le harnais de tests e2e (`test/*.e2e-spec.ts`, y compris ceux de Repas et
Colis livrés précédemment) n'enregistrait pas le `ValidationPipe` global que
`main.ts` applique en production (`whitelist`, `forbidNonWhitelisted`,
`transform`). Les DTO n'étaient donc jamais réellement validés/transformés en
test — un bug resté invisible tant qu'aucun paramètre numérique de query
string n'avait besoin de `@Type(() => Number)` pour être exploitable. Corrigé
dans les 4 fichiers de test existants ; l'app réelle n'était pas affectée
(bootstrap() dans main.ts l'a toujours fait correctement).
