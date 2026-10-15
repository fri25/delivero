export interface User {
  id: string;
  telephone: string;
  nom: string;
  email?: string | null;
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
  specialiteCuisine?: string | null;
  delaiMoyenMinutes?: number | null;
  statutOuverture: boolean;
  /** Values from TYPES_CUISINE (@delivero/config/types-cuisine). */
  typesCuisine: string[];
  delaiPreparationMin: number | null;
  /** Average dish price in FCFA (list only), null when no priced dish. */
  prixMoyen: number | null;
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

export interface RestaurantDetail extends Omit<RestaurantSummary, 'prixMoyen'> {
  plats: Plat[];
  /** Frais de livraison de la zone du restaurant (RG-08), en FCFA. */
  fraisLivraison: string;
}

/** Priced neighbourhood (GET /quartiers). */
export interface Quartier {
  id: string;
  nom: string;
  /** FCFA, Decimal serialised as a string. */
  fraisLivraison: string;
  /** "Autre quartier": the client types the name of their neighbourhood. */
  autre: boolean;
}

export interface Adresse {
  id: string;
  libelle: string;
  adresse?: string | null;
  /** Name as given by the client (list name, or typed for "Autre quartier"). */
  quartier?: string | null;
  quartierId?: string | null;
  /** Null for addresses saved before 13/10: ordering asks to complete them. */
  quartierTarifaire?: Quartier | null;
  pointDeRepere: string;
  latitude: string | null;
  longitude: string | null;
  estParDefaut: boolean;
}

export type ModePaiement = 'mobile_money' | 'especes';

export type StatutPaiement =
  | 'en_attente'
  | 'reussi'
  | 'echoue'
  | 'a_percevoir_livraison'
  | 'a_rembourser'
  | 'rembourse';

export interface PaiementResume {
  mode: ModePaiement;
  statut: StatutPaiement;
}

export type CibleNotation = 'partenaire' | 'livreur';

export interface NotationResume {
  cible: CibleNotation;
  note: number;
}

/** Livreur assigned to an order (F-CLI-26), null until one takes it. */
export interface LivreurContact {
  user: { nom: string; telephone: string };
}

export type TypeService = 'repas' | 'colis' | 'courses_express' | 'emplettes';

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
    paiement: PaiementResume | null;
    livreur: LivreurContact | null;
    notations: NotationResume[];
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
  /** F-CLI-16: description / nature du contenu du colis. */
  nature: string | null;
  fragile: boolean;
  valeurDeclaree: string | null;
  montantContreRemboursement: string | null;
  montantEncaisse: string | null;
  destinataireNom: string;
  destinataireTelephone: string;
  adresseLivraison: string;
  /** Null for parcels created before 13/10 (Q-28). */
  quartierLivraisonId?: string | null;
  pointDeRepereLivraison: string;
  programmationAt: string | null;
  nomReceptionnaire: string | null;
  photoUrl: string | null;
  /** F-CLI-22: photo de preuve de livraison prise par le livreur. */
  photoPreuveUrl: string | null;
  /** F-LIV-06: photo du colis prise par le livreur lors de la prise en charge. */
  photoEnlevementUrl?: string | null;
  /** F-LIV-06: constat / état du colis lors de l'enlèvement. */
  etatEnlevement?: string | null;
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
    paiement: PaiementResume | null;
    livreur: LivreurContact | null;
    notations: NotationResume[];
  };
}

/** Liste blanche exposée par GET /commandes/colis/suivi/:id (sans authentification). */
export interface SuiviColisPublic {
  id: string;
  statut: StatutColis;
  taille: TailleColis;
  nature: string | null;
  fragile: boolean;
  photoEnlevementUrl?: string | null;
  etatEnlevement?: string | null;
  photoPreuveUrl: string | null;
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
    paiement: PaiementResume | null;
    livreur: LivreurContact | null;
    notations: NotationResume[];
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
  /** Null for courses created before 13/10 (Q-28). */
  quartierId?: string | null;
  realisee: boolean;
  realiseeAt: string | null;
}

export interface CommandeCoursesExpress {
  id: string;
  description: string;
  photoUrls: string[];
  statut: StatutCoursesExpress;
  motif: string | null;
  createdAt: string;
  updatedAt: string;
  etapes: EtapeCourseExpress[];
  zone: { id: string; nom: string };
  commande: {
    id: string;
    montantTotal: string | null;
    paiement: PaiementResume | null;
    livreur: LivreurContact | null;
    notations: NotationResume[];
  };
}
