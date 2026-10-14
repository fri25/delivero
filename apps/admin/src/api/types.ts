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

export type TypeService = 'repas' | 'colis' | 'emplettes' | 'courses_express';

export interface AdminCommandeRow {
  id: string;
  typeService: TypeService;
  statut: string | null;
  createdAt: string;
  montantTotal: string | null;
  livreurId: string | null;
  client: { nom: string; telephone: string } | null;
  livreur: { nom: string; telephone: string } | null;
  paiement: { mode: string; statut: string } | null;
  /** Entered by the dispatcher (F-ADM-04): payment confirmed by hand. */
  saisieManuelle: boolean;
}

export interface AdminCommandesPage {
  items: AdminCommandeRow[];
  total: number;
  page: number;
  pageSize: number;
}

/** Priced neighbourhood (Q-28, decided 13/10): sets delivery prices. */
export interface Quartier {
  id: string;
  nom: string;
  /** FCFA, Decimal serialised as a string. */
  fraisLivraison: string;
  /** "Autre quartier": catch-all, the client types the name. */
  autre: boolean;
  actif: boolean;
}

export interface Zone {
  id: string;
  nom: string;
  description: string | null;
  fraisLivraison: string;
  grilleTarifaireColis: { tarifBase: string } | null;
  grilleTarifaireCoursesExpress: { tarifBase: string } | null;
}

export interface Livreur {
  id: string;
  disponible: boolean;
  noteMoyenne: string | null;
  plafondAvance: string;
  plafondCaisse: string;
  avanceEnCours: number;
  caisseAReverser: number;
  user: { nom: string; telephone: string };
  zone: { id: string; nom: string };
}

export interface ClotureCaisse {
  id: string;
  montantTheorique: string;
  montantDeclare: string;
  ecart: string;
  rapprocheeAt: string | null;
  createdAt: string;
  livreur: { user: { nom: string; telephone: string } };
  rapprocheePar: { nom: string } | null;
}

export type ModePaiement = 'mobile_money' | 'especes';
export type TailleColis = 'petit' | 'moyen' | 'grand';
export type ModeEmplettes = 'liste_libre' | 'catalogue';
export type ModeFinancementEmplettes =
  | 'mobile_money_anticipe'
  | 'especes_livraison'
  | 'avance_livreur';
export type PreferenceRemplacement = 'equivalent' | 'appeler' | 'ne_pas_acheter';

export interface Plat {
  id: string;
  nom: string;
  categorie: string;
  prix: string;
}

export interface RestaurantListItem {
  id: string;
  nom: string;
}

export interface RestaurantDetail {
  id: string;
  nom: string;
  plats: Plat[];
}

/** Restaurant as the back-office manages it (F-ADM-08). */
export interface PartenaireAdmin {
  id: string;
  nom: string;
  description: string | null;
  adresse: string | null;
  pointDeRepere: string | null;
  statutOuverture: boolean;
  /** Set by ChapExpress: hidden from clients, takes no order. */
  suspendu: boolean;
  noteMoyenne: string | null;
  createdAt: string;
  user: { nom: string; telephone: string };
  zone: { id: string; nom: string };
  _count: { plats: number; commandesRepas: number };
}

type StatutService = { statut: string } | null;

/** Payment collected then cancelled or refused: refunded by hand (F-ADM-06). */
export interface Remboursement {
  id: string;
  montant: string;
  mode: ModePaiement;
  statut: 'a_rembourser' | 'rembourse';
  referenceTransaction: string | null;
  createdAt: string;
  montantRembourse: string | null;
  referenceRemboursement: string | null;
  motifRemboursement: string | null;
  rembourseAt: string | null;
  remboursePar: { nom: string } | null;
  commande: {
    id: string;
    typeService: TypeService;
    createdAt: string;
    clientNomInvite: string | null;
    clientTelephoneInvite: string | null;
    client: { nom: string; telephone: string } | null;
    motifAnnulation: string | null;
    annuleeAt: string | null;
    annuleePar: { nom: string } | null;
    commandeRepas: { statut: string; motifRefus: string | null; partenaire: { nom: string } } | null;
    commandeColis: StatutService;
    commandeEmplettes: StatutService;
    commandeCoursesExpress: StatutService;
  };
}

export interface Remboursements {
  aRembourser: Remboursement[];
  rembourses: Remboursement[];
}

export type Periode = 'jour' | '7j' | '30j';

export interface BilanStatistique {
  demandes: number;
  terminees: number;
  annulees: number;
  enCours: number;
  montantTermine: number;
  panierMoyen: number | null;
  tauxAnnulation: number | null;
  delaiMoyenMinutes: number | null;
}

export interface ClassementStatistique {
  id: string;
  nom: string;
  terminees: number;
  montant: number;
}

/** F-ADM-14 dashboard, computed by the API for the period. */
export interface Statistiques {
  periode: Periode;
  actuel: BilanStatistique;
  precedent: BilanStatistique;
  parService: (BilanStatistique & { typeService: TypeService })[];
  parJour: { jour: string; demandes: number }[];
  restaurants: ClassementStatistique[];
  livreurs: ClassementStatistique[];
  aRembourser: { nombre: number; montant: number };
}
