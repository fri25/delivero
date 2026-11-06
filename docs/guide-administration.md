# Guide d'administration — entreprises et plateforme RapidLiv

Pour les personnes qui administrent une entreprise de livraison (écrans du
back-office) et pour l'équipe RapidLiv (app plateforme). Le fonctionnement
technique est décrit dans [architecture-multi-tenant.md](architecture-multi-tenant.md).

## Pour l'administrateur d'une entreprise

Le back-office (app admin) s'ouvre sur le domaine de votre entreprise. Le
menu ne montre que les écrans de votre rôle.

### Les deux rôles

| | Administrateur | Gestionnaire |
|---|---|---|
| Commandes, saisie manuelle, attribution, annulation | oui | oui |
| Livreurs, caisse, tableau de bord, clients | oui | oui |
| Remboursements | oui | non |
| Restaurants, zones, quartiers | oui | non |
| Réglages, utilisateurs, journal | oui | non |

### Réglages

- **Identité** : nom commercial et logo (lien `https` vers une image),
  affichés dans les applications client, livreur et partenaires.
- **Couleurs** : principale (boutons), sombre (titres), alerte (badges),
  avec un aperçu.
- **Contacts** : téléphone, WhatsApp du support (bouton d'aide des clients),
  e-mail.
- **Commission Repas** : pourcentage ajouté aux commandes Repas. Un nouveau
  taux s'applique aux commandes passées **après** l'enregistrement.
- Les applications prennent les nouveaux réglages à leur prochaine
  ouverture.

### Paiement Mobile Money (FedaPay)

Vos clients paient sur **votre** compte FedaPay.

1. Dans votre tableau de bord FedaPay : *Paramètres > Clés API* (clé
   secrète) et *Webhooks* (secret du webhook).
2. Dans **Réglages > Paiement Mobile Money**, saisissez les deux, choisissez
   *Test* ou *Production*, enregistrez. Les clés ne sont plus jamais
   réaffichées ; pour les changer, saisissez-en de nouvelles.
3. Déclarez dans FedaPay l'**adresse du webhook** affichée sur l'écran.

Commencez en *Test* (sandbox), passez en *Production* après un paiement
d'essai réussi.

### Utilisateurs

- **Ajouter un compte** : nom, téléphone, rôle, mot de passe provisoire (8
  caractères minimum) à transmettre à la personne. Si le numéro a déjà un
  compte (client, autre entreprise), la personne garde son mot de passe.
- Pour se connecter, la personne saisit son numéro au format affiché après
  la création (`+229…`).
- **Changer de rôle** ou **Suspendre** depuis la liste : effet immédiat,
  session comprise. Vous ne pouvez modifier ni votre propre accès ni retirer
  le dernier administrateur.
- Livreurs et restaurants se créent dans leurs propres écrans.

### Journal

Chaque modification faite dans les applications (création, modification,
suppression) : qui, quand, quoi, et les **noms** des champs envoyés —
jamais leurs valeurs. Les événements de sécurité (jeton d'une autre
entreprise, paiement d'une autre entreprise) y figurent aussi. Filtre par
type d'action, entrées plus anciennes en bas de page.

### Clients

Liste des clients inscrits chez vous, recherche par nom ou téléphone, nombre
de commandes et date de la dernière.

## Pour l'équipe RapidLiv (app plateforme)

L'app plateforme a sa propre connexion, réservée aux comptes
super-administrateurs (premier compte : [deploiement.md § 9](deploiement.md)).
Chaque action y est inscrite au journal de la plateforme.

### Créer une entreprise

**Nouvelle entreprise** :

- raison sociale, **identifiant** (sous-domaine, minuscules et tirets, non
  modifiable), nom commercial, ville ;
- **commission Repas** convenue avec l'entreprise (aucun taux par défaut) ;
- fonctionnalités ouvertes (services, modes de paiement,
  contre-remboursement) ;
- offre et statut (essai ou actif — suivi manuel, aucune facturation) ;
- premier administrateur (nom, téléphone, mot de passe provisoire).

Pays, devise, fuseau et indicatif sont ceux du Bénin. L'entreprise règle
ensuite elle-même logo, couleurs, contacts et FedaPay.

### Domaines

Les applications ouvertes sur un domaine de l'entreprise la servent.

1. **Ajouter un domaine** (cocher *Principal* pour celui des liens envoyés
   aux clients).
2. Faire créer chez le fournisseur DNS l'enregistrement **TXT** affiché
   (`_rapidliv.<domaine>`), puis **Vérifier**. La propagation peut prendre
   une heure.
3. Un domaine non vérifié sert déjà l'entreprise, mais n'est pas utilisé
   dans les liens (paiement, suivi).

L'hébergement des sous-domaines n'est pas encore décidé (Q-MT-6,
[deploiement.md § 10](deploiement.md)).

### Suspendre une entreprise

**Suspendre** sur la fiche : toutes les requêtes de l'entreprise sont
refusées (connexion, commandes, applications), ses données restent
intactes. **Réactiver** rétablit tout. Il n'y a pas de suppression.

### Fonctionnalités et offre

- Cocher ou décocher une fonctionnalité la retire aussitôt des applications
  de l'entreprise (les commandes en cours vont à leur terme). Elle reste
  bornée par ce que la plateforme active techniquement.
- L'offre et son statut sont informatifs ; seul le statut de l'entreprise
  coupe l'accès.

### Statistiques et journal

La liste des entreprises donne, par entreprise et au total : commandes et
montant commandé sur 30 jours (tous statuts), livreurs disponibles et
inscrits, clients. Le **Journal** montre les actions de toutes les
entreprises ou de la plateforme seule, filtrables, avec les événements de
sécurité.
