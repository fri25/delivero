# Exigences non fonctionnelles

Reprend les exigences du cahier des charges (section 6), rendues mesurables. Les
seuils chiffrés absents du cahier des charges sont proposés et marqués
**[DÉDUIT, proposé]** — à valider avant de les figer en critères de recette.

## Performance

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| LCP (Largest Contentful Paint) sur la page d'accueil | ≤ 3 s sur profil réseau « 3G lent » (≈ 1.6 Mbps descendant / 750 Kbps montant / RTT 300 ms) | Lighthouse CI, profil mobile, throttling 3G lent |
| Poids du bundle JS critique (route d'accueil, gzip) | ≤ 150 Ko gzip **[DÉDUIT, proposé]** | Analyse de bundle en CI (ex. rollup/vite bundle analyzer) |
| Poids total de la page d'accueil (JS + CSS + images critiques) | ≤ 500 Ko gzip **[DÉDUIT, proposé]** | Idem |
| Taille d'une image compressée envoyée (ticket de caisse, photo colis, photo produit) | ≤ 300 Ko par image **[DÉDUIT, proposé]** | Compression côté client avant upload, mesurée en test |
| Temps de réponse API sur les endpoints de commande | ≤ 500 ms p95 **[DÉDUIT, proposé]** | Monitoring APM |

## Disponibilité

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Disponibilité de la plateforme sur la plage d'activité | ≥ 99 % | Monitoring externe (uptime checks) |
| Couverture de service | 7j/7 sur la plage d'activité ChapExpress | Revue exploitation |

## Sécurité

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Chiffrement des échanges | 100 % du trafic en HTTPS/TLS | Scan automatisé (ex. SSL Labs, header checks) |
| Stockage des mots de passe | Hachage avec algorithme adapté (ex. bcrypt/argon2) **[DÉDUIT]** | Revue de code / audit sécurité |
| Sauvegardes | Sauvegarde complète automatique quotidienne | Vérification des jobs de sauvegarde |
| Test de restauration | **[À ARBITRER]** fréquence de test de restauration (non précisée dans le cahier des charges) | Procédure d'exploitation |
| Journalisation | 100 % des accès et mouvements financiers journalisés | Audit du journal d'actions (voir [modele-donnees.md](modele-donnees.md)) |
| Données sensibles (ordonnances, documents transportés) | Accès restreint aux rôles concernés, chiffrement au repos **[DÉDUIT]** | Revue de sécurité |

## Compatibilité

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Navigateurs supportés | Deux dernières versions majeures de Chrome, Safari, Firefox, Edge **[DÉDUIT]** | Tests cross-browser |
| Support d'appareil | Ordinateur et smartphone, design responsive | Tests sur device réels (bas de gamme prioritaire) |

## Ergonomie

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Étapes de commande | ≤ 4 étapes, du choix du service à la confirmation, pour chacun des 4 services | Revue UX, tests utilisateurs avec publics peu familiers du numérique |
| Langue de l'interface | 100 % en français | Revue de contenu |

## Évolutivité

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Volume de commandes supportées | **[À ARBITRER]** — non chiffré dans le cahier des charges | Test de charge |
| Ajout d'un nouveau service ou d'une nouvelle zone | Sans refonte du modèle de données (`type_service` extensible) | Revue d'architecture |

## Traçabilité

| Mesure | Cible | Méthode de mesure |
|---|---|---|
| Historisation des commandes, paiements, avances, encaissements, preuves de livraison | 100 % journalisé, aucune perte | Audit du journal d'actions |
| Rétention des données d'historique | **[À ARBITRER]** durée de conservation | Politique de rétention à définir |
