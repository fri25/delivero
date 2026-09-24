// Périmètre de la V1 — ce qui est ouvert aux utilisateurs, indépendamment de
// ce qui est développé. Tout ce qui est masqué ici a du code complet derrière
// lui : rien n'est supprimé, seuls les points d'entrée disparaissent.
//
// Chaque drapeau a son pendant côté API (apps/api/src/config/env.validation.ts
// et perimetre-v1.service.ts). Les deux sont nécessaires : ce fichier ne pilote
// que les interfaces, et une PWA déjà installée conserve son ancien bundle en
// cache — le serveur doit donc refuser de son côté.
//
// Comme ces constantes sont littérales, le bundler élimine entièrement les
// branches masquées du build (vérifié : 0 occurrence d'Emplettes dans le
// bundle client). Elles sont annotées `boolean` pour que TypeScript ne réduise
// pas le type au littéral et ne signale pas les branches de réouverture comme
// inatteignables.

// --- Services ---------------------------------------------------------------
// Emplettes est développé, testé et fonctionnel de bout en bout, mais n'est pas
// opéré au lancement : le mode catalogue suppose le module Commerce partenaire
// (F-COM, non commencé) et le mode liste libre repose sur une avance de fonds
// du livreur dont les règles ne sont pas arbitrées (Q-02, Q-08, Q-11, Q-12,
// Q-26 dans docs/decisions-ouvertes.md).
export const SERVICES_ACTIFS = ['repas', 'colis', 'courses_express'] as const;

export type ServiceActif = (typeof SERVICES_ACTIFS)[number];

export const EMPLETTES_ACTIF: boolean = false;

// --- Paiement ---------------------------------------------------------------
// Décision du 23/09/2026 : la V1 encaisse uniquement par Mobile Money, les
// espèces à la livraison sont retirées. Écart assumé avec RG-01, qui prévoit
// les deux moyens sur les 4 services (voir docs/regles-gestion.md).
//
// ⚠️ Tant que l'agrégateur FedaPay n'est pas intégré (aucun module paiement ni
// webhook dans apps/api), un paiement Mobile Money reste en `en_attente` et
// n'est jamais encaissé. Aucune commande n'est donc encaissable en l'état :
// ne pas ouvrir à de vrais clients avant cette intégration.
export const ESPECES_ACTIF: boolean = false;

// Contre-remboursement Colis (F-CLI-18, RG-04) : le livreur encaisse le
// destinataire en espèces, par nature. Retiré de la V1 avec les espèces. Les
// colis déjà créés avec un contre-remboursement restent livrables et
// encaissables normalement — seule la création de nouveaux est bloquée.
export const CONTRE_REMBOURSEMENT_ACTIF: boolean = false;
