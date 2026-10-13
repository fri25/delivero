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

### Mesure du 13/10/2026 (app client, accueil, build de production)

Profil : 3G lent ci-dessus + processeur ralenti ×4, écran mobile 390 px, cache
vide, Edge headless via le protocole DevTools (pas Lighthouse CI, pas encore en
place) ; médiane de 3 chargements.

| Mesure | Avant | Après | Cible |
|---|---|---|---|
| LCP (photo Repas de l'accueil) | ≈ 4,6 s | ≈ 3,9 s | ≤ 3 s — **non atteinte** |
| FCP | ≈ 3,8 s | ≈ 2,3 s | — |
| JS critique (gzip) | 103 Ko | 103 Ko | ≤ 150 Ko ✓ |
| Poids total accueil | ≈ 372 Ko | ≈ 372 Ko | ≤ 500 Ko ✓ |

Corrections faites : préchargement depuis le HTML de la photo de l'accueil et
des deux polices (`preloadAccueil` dans `apps/client/vite.config.ts`), coquille
statique dans `index.html` (en-tête + haut de l'accueil sur téléphone), priorité
haute sur la photo principale et vignettes différées. Écart restant : environ
2 s d'exécution du JS (react-dom + react-router ≈ 260 Ko minifiés) sur un
téléphone lent, pendant lesquelles rien ne s'affiche. Sans JS, la coquille et la
photo s'affichent à ≈ 2,0 s. Pistes pour atteindre 3 s : pré-rendu de l'accueil
au build, ou bibliothèque plus légère (Preact) — à arbitrer.

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
