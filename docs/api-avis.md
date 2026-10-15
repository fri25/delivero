# API des avis client (Remplacée par Notations)

> [!NOTE]
> Le système d'avis (`apps/api/src/avis/`, tables `avis_partenaires` et `avis_livreurs`) a été supprimé au profit du système unifié de notations (`apps/api/src/notations/`, table `notations`, module `NotationsModule`).
> Cela résout le conflit F-CLI-08 où les deux systèmes recalculaient et écrasaient mutuellement `noteMoyenne`.

## Endpoints actuels de notation (F-CLI-08)

Le système de notation officiel est exposé sous le préfixe `/notations` :

### `POST /notations/commandes/:commandeId`

Corps JSON :
```json
{
  "notes": [
    {
      "cible": "partenaire",
      "note": 5,
      "commentaire": "Repas délicieux !"
    },
    {
      "cible": "livreur",
      "note": 5,
      "commentaire": "Livraison rapide."
    }
  ]
}
```

- Accessible aux clients connectés ainsi qu'au suivi invité (`/invite/commandes/noter`).
- Une seule note par commande et par cible (`partenaire` pour Repas, `livreur` pour tous les services livrés).
- Recalcule la `noteMoyenne` officielle sur les tables `partenaires` et `livreurs`.
