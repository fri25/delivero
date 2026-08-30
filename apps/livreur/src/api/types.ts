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

export interface Livreur {
  id: string;
  userId: string;
  zoneId: string;
  plafondAvance: string;
  plafondCaisse: string;
  disponible: boolean;
  noteMoyenne: string | null;
}

export interface PortefeuilleResume {
  avanceEnCours: number;
  plafondAvance: number;
  caisseAReverser: number;
  plafondCaisse: number;
}

export interface ClotureCaisse {
  id: string;
  montantTheorique: string;
  montantDeclare: string;
  ecart: string;
  rapprocheeAt: string | null;
  createdAt: string;
}

export type TypeService = 'repas' | 'colis' | 'emplettes' | 'courses_express';

export interface RecapJournalier {
  parService: Record<TypeService, number>;
  encaisseAujourdhui: number;
  avanceAujourdhui: number;
}

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

export type ModePaiement = 'mobile_money' | 'especes';

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
    adresse: { libelle: string; pointDeRepere: string } | null;
    client: { nom: string; telephone: string } | null;
    paiement: { mode: ModePaiement; statut: string } | null;
  };
  partenaire: {
    id: string;
    nom: string;
    userId: string;
    adresse: string | null;
    pointDeRepere: string | null;
  };
  lignes: LigneCommandeRepas[];
}

// --- Service Colis (voir docs/api-colis.md) ---------------------------------

export type TailleColis = 'petit' | 'moyen' | 'grand';

export type StatutColis =
  | 'confirmee'
  | 'livreur_en_route_enlevement'
  | 'colis_recupere'
  | 'en_route'
  | 'livre'
  | 'litige'
  | 'annulee';

// Le code de remise (codeOtp) n'est jamais renvoyé aux endpoints livreur
// (voir api-colis.md) : il n'apparaît donc pas dans ce type.
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
  createdAt: string;
  updatedAt: string;
  adresseEnlevement: { id: string; libelle: string; pointDeRepere: string };
  zone: { id: string; nom: string };
  commande: {
    id: string;
    montantTotal: string | null;
    client: { id: string; nom: string; telephone: string } | null;
  };
}

// --- Service Emplettes, mode liste libre uniquement (voir docs/api-emplettes.md) ---

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
    adresse: { libelle: string; pointDeRepere: string } | null;
    montantTotal: string | null;
    client: { id: string; nom: string; telephone: string } | null;
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
    client: { id: string; nom: string; telephone: string } | null;
  };
}
