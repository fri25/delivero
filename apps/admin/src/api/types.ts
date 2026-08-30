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
}

export interface AdminCommandesPage {
  items: AdminCommandeRow[];
  total: number;
  page: number;
  pageSize: number;
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
