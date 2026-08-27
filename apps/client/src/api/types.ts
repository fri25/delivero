export interface User {
  id: string;
  telephone: string;
  nom: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RestaurantSummary {
  id: string;
  nom: string;
  description: string | null;
  horaires: string | null;
  noteMoyenne: string | null;
  statutOuverture: boolean;
  /** Pas encore renvoyée par l'API — champ prévu pour de vraies photos partenaires. */
  imageUrl?: string | null;
}

export interface Plat {
  id: string;
  partenaireId: string;
  nom: string;
  categorie: string | null;
  description: string | null;
  prix: string;
  photoUrl: string | null;
  disponible: boolean;
}

export interface RestaurantDetail extends RestaurantSummary {
  plats: Plat[];
  /** Frais de livraison de la zone du restaurant (RG-08), en FCFA. */
  fraisLivraison: string;
}

export interface Adresse {
  id: string;
  libelle: string;
  pointDeRepere: string;
  latitude: string | null;
  longitude: string | null;
  estParDefaut: boolean;
}

export type ModePaiement = 'mobile_money' | 'especes';

export type StatutRepas =
  | 'en_attente_acceptation'
  | 'confirmee'
  | 'refusee'
  | 'en_preparation'
  | 'prete'
  | 'recuperee_par_livreur'
  | 'en_route'
  | 'livree'
  | 'annulee';

export interface LigneCommandeRepas {
  id: string;
  platId: string;
  quantite: number;
  prixUnitaire: string;
  instructions: string | null;
  plat: { id: string; nom: string };
}

export interface CommandeRepas {
  id: string;
  statut: StatutRepas;
  motifRefus: string | null;
  createdAt: string;
  commande: {
    id: string;
    sousTotal: string | null;
    fraisLivraison: string | null;
    commission: string | null;
    montantTotal: string | null;
    adresseId: string | null;
  };
  partenaire: { id: string; nom: string; userId: string };
  lignes: LigneCommandeRepas[];
}

// --- Service Colis (voir docs/api-colis.md) ---------------------------------

export interface Zone {
  id: string;
  nom: string;
}

export type TailleColis = 'petit' | 'moyen' | 'grand';

export type StatutColis =
  | 'confirmee'
  | 'livreur_en_route_enlevement'
  | 'colis_recupere'
  | 'en_route'
  | 'livre'
  | 'litige'
  | 'annulee';

export interface CommandeColis {
  id: string;
  statut: StatutColis;
  taille: TailleColis;
  fragile: boolean;
  valeurDeclaree: string | null;
  montantContreRemboursement: string | null;
  montantEncaisse: string | null;
  destinataireNom: string;
  destinataireTelephone: string;
  adresseLivraison: string;
  pointDeRepereLivraison: string;
  programmationAt: string | null;
  nomReceptionnaire: string | null;
  motif: string | null;
  /** Uniquement présent dans la réponse au client propriétaire (voir api-colis.md). */
  codeOtp?: string;
  createdAt: string;
  updatedAt: string;
  adresseEnlevement: { id: string; libelle: string; pointDeRepere: string };
  zone: { id: string; nom: string };
  commande: {
    id: string;
    montantTotal: string | null;
    paiement: { mode: ModePaiement; statut: string } | null;
  };
}

/** Liste blanche exposée par GET /commandes/colis/suivi/:id (sans authentification). */
export interface SuiviColisPublic {
  id: string;
  statut: StatutColis;
  taille: TailleColis;
  fragile: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Service Emplettes, mode liste libre uniquement (voir docs/api-emplettes.md) ---

export type ModeEmplettes = 'liste_libre' | 'catalogue';

export type ModeFinancementEmplettes =
  | 'mobile_money_anticipe'
  | 'especes_livraison'
  | 'avance_livreur';

export type PreferenceRemplacement = 'equivalent' | 'appeler' | 'ne_pas_acheter';

export type StatutArticleEmplette = 'en_attente' | 'achete' | 'indisponible' | 'remplace';

export type StatutEmplettes =
  | 'confirmee'
  | 'achats_en_cours'
  | 'validation_depassement'
  | 'achats_termines'
  | 'en_route'
  | 'livree'
  | 'litige'
  | 'annulee';

export interface ArticleEmplette {
  id: string;
  libelle: string;
  preferenceRemplacement: PreferenceRemplacement;
  statut: StatutArticleEmplette;
  prixReel: string | null;
  produitRemplacementLibelle: string | null;
}

export interface CommandeEmplettes {
  id: string;
  mode: ModeEmplettes;
  lieuAchat: string | null;
  budgetMax: string;
  montantReel: string | null;
  modeFinancement: ModeFinancementEmplettes;
  recapitulatifAchats: string | null;
  statut: StatutEmplettes;
  motif: string | null;
  createdAt: string;
  updatedAt: string;
  articles: ArticleEmplette[];
  zone: { id: string; nom: string };
  commande: {
    id: string;
    sousTotal: string | null;
    fraisLivraison: string | null;
    commission: string | null;
    montantTotal: string | null;
    paiement: { mode: ModePaiement; statut: string } | null;
  };
}

// --- Service Courses express (voir docs/api-courses-express.md) ------------

export type StatutCoursesExpress =
  | 'confirmee'
  | 'en_cours'
  | 'etape_realisee'
  | 'terminee'
  | 'litige'
  | 'annulee';

export interface EtapeCourseExpress {
  id: string;
  ordre: number;
  description: string;
  adresse: string | null;
  pointDeRepere: string;
  realisee: boolean;
  realiseeAt: string | null;
}

export interface CommandeCoursesExpress {
  id: string;
  description: string;
  statut: StatutCoursesExpress;
  motif: string | null;
  createdAt: string;
  updatedAt: string;
  etapes: EtapeCourseExpress[];
  zone: { id: string; nom: string };
  commande: {
    id: string;
    montantTotal: string | null;
    paiement: { mode: ModePaiement; statut: string } | null;
  };
}
