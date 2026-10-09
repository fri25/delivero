# API des avis client

Les avis sont attachés à une commande et ne sont disponibles qu'au client qui
l'a créée. Les routes exigent un jeton client.

## `GET /commandes/:commandeId/avis`

Retourne les cibles évaluables pour cette commande : partenaire (Repas) et/ou
livreur (si affecté), avec le nom, l'éligibilité et l'avis déjà envoyé.

## `POST /commandes/:commandeId/avis`

Corps JSON :

```json
{
  "cible": "partenaire",
  "note": 5,
  "commentaire": "Livraison rapide et repas bien préparé."
}
```

`cible` vaut `partenaire` ou `livreur`. La note est un entier de 1 à 5 ; le
commentaire est facultatif et limité à 500 caractères. Le service doit être
terminé et la cible doit être associée à la commande. La base impose un seul avis
par commande et par cible ; une tentative répétée reçoit un conflit HTTP 409.
La moyenne de la cible est recalculée à chaque avis accepté.

Les commandes Repas permettent d'évaluer le restaurant et, lorsqu'un livreur
leur est affecté, ce livreur. Les commandes Colis et Courses express permettent
d'évaluer le livreur affecté. Aucun avis n'est possible avant la fin de la
prestation.
