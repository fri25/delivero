import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Operateur } from '@/stores/auth-store';

// apps/api/src/plateforme (étape 9 of docs/plan-migration-multi-tenant.md).

export interface Statistiques {
  commandes: number;
  commandes30j: number;
  montant30j: number;
  livreurs: number;
  livreursDisponibles: number;
  clients: number;
  partenaires: number;
}

export interface EntrepriseResume {
  id: string;
  slug: string;
  nom: string;
  statut: 'actif' | 'suspendu';
  createdAt: string;
  nomCommercial: string | null;
  ville: string | null;
  domaines: { domaine: string; principal: boolean; verifie: boolean }[];
  abonnement: { plan: string; statut: string } | null;
  statistiques: Statistiques;
}

export interface EntrepriseDetail {
  id: string;
  slug: string;
  nom: string;
  statut: 'actif' | 'suspendu';
  createdAt: string;
  parametres: {
    nomCommercial: string;
    ville: string;
    tauxCommission: number;
    telephoneContact: string | null;
    emailContact: string | null;
  } | null;
  domaines: {
    id: string;
    domaine: string;
    principal: boolean;
    verifieAt: string | null;
    verification: { nom: string; valeur: string };
  }[];
  fonctionnalites: { code: string; ouverte: boolean }[];
  abonnement: {
    planCode: string;
    plan: string;
    statut: StatutAbonnement;
    debutAt: string;
    finAt: string | null;
  } | null;
  administrateurs: { nom: string; telephone: string | null; statut: string }[];
  statistiques: Statistiques;
}

export type StatutAbonnement = 'essai' | 'actif' | 'suspendu' | 'termine';

export interface Offre {
  code: string;
  nom: string;
  description: string | null;
}

export interface NouvelleEntreprise {
  slug: string;
  nom: string;
  nomCommercial?: string;
  ville: string;
  tauxCommission: number;
  fonctionnalites: string[];
  planCode: string;
  statutAbonnement: 'essai' | 'actif';
  admin: { telephone: string; nom: string; motDePasse?: string };
}

export interface EntreeJournal {
  id: string;
  action: string;
  cibleId: string | null;
  details: { chemin?: string; champs?: string[]; tidJeton?: string | null } | null;
  ip: string | null;
  createdAt: string;
  tenant: { id: string; nom: string } | null;
  acteur: { id: string; nom: string; telephone: string | null } | null;
}

export const LIBELLES_FONCTIONNALITES: Record<string, string> = {
  'service.repas': 'Repas',
  'service.colis': 'Colis',
  'service.courses_express': 'Courses express',
  'service.emplettes': 'Emplettes',
  'paiement.mobile_money': 'Paiement Mobile Money',
  'paiement.especes': 'Paiement en espèces',
  'colis.contre_remboursement': 'Contre-remboursement Colis',
};

export function useConnexion() {
  return useMutation({
    mutationFn: (dto: { telephone: string; motDePasse: string }) =>
      api<{ accessToken: string; user: Operateur }>('/auth/connexion', { method: 'POST', body: dto }),
  });
}

export function useEntreprises() {
  return useQuery({ queryKey: ['entreprises'], queryFn: () => api<EntrepriseResume[]>('/entreprises') });
}

export function useEntreprise(id: string) {
  return useQuery({ queryKey: ['entreprise', id], queryFn: () => api<EntrepriseDetail>(`/entreprises/${id}`) });
}

export function useOffres() {
  return useQuery({ queryKey: ['offres'], queryFn: () => api<Offre[]>('/offres'), staleTime: 5 * 60_000 });
}

export function useCreerEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: NouvelleEntreprise) => api<EntrepriseDetail>('/entreprises', { method: 'POST', body: dto }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entreprises'] }),
  });
}

/** Every change on a company answers with its new detail. */
export function useActionEntreprise<T>(id: string, requete: (input: T) => Promise<EntrepriseDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requete,
    onSuccess: (detail) => {
      queryClient.setQueryData(['entreprise', id], detail);
      void queryClient.invalidateQueries({ queryKey: ['entreprises'] });
    },
  });
}

export const actions = {
  statut: (id: string) => (statut: 'actif' | 'suspendu') =>
    api<EntrepriseDetail>(`/entreprises/${id}`, { method: 'PATCH', body: { statut } }),
  fonctionnalites: (id: string) => (ouvertes: string[]) =>
    api<EntrepriseDetail>(`/entreprises/${id}/fonctionnalites`, { method: 'PUT', body: { ouvertes } }),
  abonnement: (id: string) => (dto: { planCode: string; statut: StatutAbonnement; finAt: string | null }) =>
    api<EntrepriseDetail>(`/entreprises/${id}/abonnement`, { method: 'PUT', body: dto }),
  ajouterDomaine: (id: string) => (dto: { domaine: string; principal: boolean }) =>
    api<EntrepriseDetail>(`/entreprises/${id}/domaines`, { method: 'POST', body: dto }),
  retirerDomaine: (id: string) => (domaineId: string) =>
    api<EntrepriseDetail>(`/entreprises/${id}/domaines/${domaineId}`, { method: 'DELETE' }),
  verifierDomaine: (id: string) => (domaineId: string) =>
    api<EntrepriseDetail>(`/entreprises/${id}/domaines/${domaineId}/verification`, { method: 'POST' }),
};

export function useJournal(entreprise: string, action: string) {
  return useInfiniteQuery({
    queryKey: ['journal', entreprise, action],
    queryFn: ({ pageParam }) =>
      api<{ entrees: EntreeJournal[]; suivant: string | null }>('/journal', {
        query: { entreprise, action, avant: pageParam ?? undefined },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.suivant,
  });
}
