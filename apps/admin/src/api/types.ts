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
