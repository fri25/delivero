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

export interface Restaurant {
  id: string;
  nom: string;
  type: 'restaurant' | 'commerce';
  description: string | null;
  horaires: string | null;
  statutOuverture: boolean;
  tauxCommission: string | null;
  noteMoyenne: string | null;
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
