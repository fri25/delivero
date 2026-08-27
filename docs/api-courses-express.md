# API Courses express — contrat des endpoints

Backend + écrans client/livreur (voir [modules.md](modules.md) F-CLI-23 à 27,
F-LIV-08 partiel). Pas de suivi public tiers comme pour Colis : aucune notion
de destinataire distinct du client dans ce service.

Préfixe global de l'API : `/api`. Toutes les routes ci-dessous sont donc
`/api/commandes/courses-express/...`.

Modèle : [modele-donnees.md](modele-donnees.md) (entités
CommandeCoursesExpress, EtapeCourseExpress), machine à états et règles
métier : [service-courses-express.md](service-courses-express.md),
[regles-gestion.md](regles-gestion.md) RG-11, RG-16.

## Statuts (StatutCoursesExpress)

```
confirmee → en_cours → etape_realisee → ... → terminee
en_cours → litige
confirmee → annulee
```

`en_cours` passe directement de `confirmee` à la prise en charge (pas
d'étape "en route" intermédiaire, contrairement à Colis). `etape_realisee`
est un état transitoire : chaque étape réalisée y bascule la commande tant
qu'il en reste, `terminee` dès la dernière. `litige` atteignable uniquement
depuis `en_cours` (pas depuis `etape_realisee`), déclaré par le livreur, sans
validation dispatcher (aucun back-office).

## Tarification

`tarifBase` par zone (`GrilleTarifaireCoursesExpress`, provisoire, non
validée par la direction) + majoration provisoire de 200 FCFA par arrêt
au-delà du premier (constante en code,
`MAJORATION_PAR_ARRET_SUPPLEMENTAIRE`). Pas de calcul de distance réelle
(aucune intégration cartographique, voir CLAUDE.md [À FAIRE]).

## Endpoints client (rôle `client`)

### `GET /commandes/courses-express/estimation`
Query : `zoneId` (string), `nombreEtapes` (int ≥ 1). Réponse `200` :
`{ zoneId, nombreEtapes, tarif }`.

### `POST /commandes/courses-express`
Body :
```jsonc
{
  "description": "string",              // description libre de la commission
  "zoneId": "string",
  "modePaiement": "mobile_money | especes",
  "etapes": [
    { "description": "string", "pointDeRepere": "string", "adresse": "string?" }
  ]                                       // au moins 1 étape
}
```
Réponse `201` : la `CommandeCoursesExpress` créée (statut `confirmee`), avec
ses étapes numérotées dans l'ordre soumis. `commande.montantTotal` toujours
recalculé côté serveur (aucun montant envoyé par le client n'est pris en
compte).

### `GET /commandes/courses-express/mes-commandes`
Liste des courses du client connecté, plus récentes d'abord.

### `PATCH /commandes/courses-express/:id/annuler`
Depuis `confirmee` uniquement (avant attribution). `403` si la commande
n'appartient pas au client. `409` si le statut ne le permet plus.

## Endpoints livreur (rôle `livreur`)

### `GET /commandes/courses-express/disponibles`
Courses `confirmee`, non attribuées, dans la zone du livreur connecté.

### `GET /commandes/courses-express/mes-courses`
Courses attribuées au livreur connecté, tous statuts, plus récentes
d'abord.

### `PATCH /commandes/courses-express/:id/prendre-en-charge`
Attribution atomique, même garantie que Colis/Emplettes
(`Commande.livreurId` conditionné sur `null` + statut `confirmee`). `400`
si le livreur n'est pas `disponible`. `409` si zéro ligne affectée. Statut
→ `en_cours` directement.

### `PATCH /commandes/courses-express/:id/etapes/:etapeId/realiser`
Aucun corps. Depuis `en_cours` ou `etape_realisee` uniquement (`409`
sinon). `409` si l'étape est déjà réalisée (pas de double comptage). Marque
l'étape réalisée et son horodatage ; statut → `etape_realisee` s'il reste
des étapes non réalisées, sinon `terminee`. Erreurs : `403` si le livreur
n'est pas l'attributaire, `404` si l'étape n'appartient pas à cette
commande.

### `PATCH /commandes/courses-express/:id/litige`
Body : `{ "motif": "string" }`. Depuis `en_cours` uniquement — pas depuis
`etape_realisee`, strictement conforme à la machine à états.

## Endpoint partagé (client, livreur attributaire ou `admin_dispatcher`)

### `GET /commandes/courses-express/:id`
`404` introuvable. `403` si l'appelant n'est ni le client propriétaire, ni
le livreur attributaire, ni `admin_dispatcher`.

## Écrans livrés

- **Client** : formulaire de demande (description, étapes multi-arrêts,
  tarif indicatif, mode de paiement), liste "mes courses", détail avec
  suivi étape par étape et annulation.
- **Livreur** : "Courses express disponibles" (prise en charge avec
  gestion du 409), "Mes courses express" (réalisation étape par étape,
  signalement d'un litige). Itinéraire Google Maps par étape (lien
  `googleMapsSearchUrl`, pas de carte intégrée — F-LIV-08 reste partiel,
  cohérent avec Colis/Repas).

## Hors périmètre

- **Photos/pièces jointes** (F-CLI-23 partiel) : aucun stockage S3 intégré.
- **Avance de fonds pour achat simple** ("achat simple dans une boutique
  précise") : mécanisme non détaillé dans le cahier des charges
  ([DÉDUIT]/[À ARBITRER], voir service-courses-express.md) — non
  implémenté, pas de champ montant à avancer.
- **Validation manuelle des commissions inhabituelles** (RG-11) : seuil non
  arbitré, aucun back-office pour la traiter.
- **Renégociation de prix en cours d'exécution** (étape supplémentaire
  découverte) : `[À ARBITRER]`, non implémenté — la course se termine ou
  passe en litige.
- **Échange direct client ↔ livreur** (F-CLI-26/F-LIV) : couvert par un
  lien `tel:` vers le téléphone du client, exposé dans la réponse livreur
  (pas de messagerie intégrée).
- **Mode invité** : compte client connecté exigé, cohérence avec les
  autres services.
