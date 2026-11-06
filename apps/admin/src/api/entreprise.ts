import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chargerEntreprise } from '@delivero/config/entreprise';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';

// Étape 8 of docs/plan-migration-multi-tenant.md: the company's own space
// (apps/api/src/entreprise).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface EtatFedapay {
  configure: boolean;
  source: 'entreprise' | 'environnement' | null;
  environnement: 'sandbox' | 'live' | null;
  modifieLe: string | null;
  cheminWebhook: string;
}

export interface ParametresEntreprise {
  slug: string;
  nomCommercial: string;
  logoUrl: string | null;
  couleurPrimaire: string;
  couleurMarine: string;
  couleurSignal: string;
  telephoneContact: string | null;
  whatsappSupport: string | null;
  emailContact: string | null;
  ville: string;
  pays: string;
  devise: string;
  fuseauHoraire: string;
  indicatifTelephone: string;
  tauxCommission: number;
  fedapay: EtatFedapay;
}

export type ModifierParametresInput = Partial<
  Pick<
    ParametresEntreprise,
    | 'nomCommercial'
    | 'logoUrl'
    | 'couleurPrimaire'
    | 'couleurMarine'
    | 'couleurSignal'
    | 'telephoneContact'
    | 'whatsappSupport'
    | 'emailContact'
    | 'ville'
    | 'tauxCommission'
  >
>;

export interface FedapayInput {
  cleSecrete: string;
  secretWebhook: string;
  environnement: 'sandbox' | 'live';
}

export type RoleAttribuable = 'admin_entreprise' | 'gestionnaire';

export interface UtilisateurBackOffice {
  id: string;
  userId: string;
  nom: string;
  telephone: string | null;
  role: string;
  statut: 'actif' | 'suspendu';
  createdAt: string;
}

export interface InviterInput {
  telephone: string;
  nom: string;
  role: RoleAttribuable;
  motDePasse?: string;
}

export interface EntreeJournal {
  id: string;
  action: string;
  cibleType: string | null;
  cibleId: string | null;
  details: { chemin?: string; champs?: string[] } | null;
  ip: string | null;
  createdAt: string;
  acteur: { id: string; nom: string; telephone: string | null } | null;
}

export interface PageJournal {
  entrees: EntreeJournal[];
  suivant: string | null;
}

export interface ClientEntreprise {
  id: string;
  nom: string;
  telephone: string | null;
  statut: string;
  inscritLe: string;
  commandes: number;
  derniereCommande: string | null;
}

export interface PageClients {
  total: number;
  page: number;
  parPage: number;
  clients: ClientEntreprise[];
}

const CLE_PARAMETRES = ['entreprise-parametres'];
const CLE_UTILISATEURS = ['entreprise-utilisateurs'];

export function useParametresEntreprise() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: CLE_PARAMETRES,
    queryFn: () => apiFetch<ParametresEntreprise>('/admin/entreprise/parametres', { token }),
    enabled: Boolean(token),
  });
}

function useMutationParametres<T>(requete: (input: T, token: string | null) => Promise<ParametresEntreprise>) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => requete(input, token),
    onSuccess: (parametres) => {
      queryClient.setQueryData(CLE_PARAMETRES, parametres);
      // The back-office itself shows the new name and colours.
      void chargerEntreprise(API_URL);
    },
  });
}

export function useModifierParametres() {
  return useMutationParametres((dto: ModifierParametresInput, token) =>
    apiFetch<ParametresEntreprise>('/admin/entreprise/parametres', { method: 'PATCH', body: dto, token }),
  );
}

export function useEnregistrerFedapay() {
  return useMutationParametres((dto: FedapayInput, token) =>
    apiFetch<ParametresEntreprise>('/admin/entreprise/fedapay', { method: 'PUT', body: dto, token }),
  );
}

export function useUtilisateurs() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: CLE_UTILISATEURS,
    queryFn: () => apiFetch<UtilisateurBackOffice[]>('/admin/entreprise/utilisateurs', { token }),
    enabled: Boolean(token),
  });
}

function useMutationUtilisateur<T>(requete: (input: T, token: string | null) => Promise<UtilisateurBackOffice>) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => requete(input, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_UTILISATEURS }),
  });
}

export function useInviterUtilisateur() {
  return useMutationUtilisateur((dto: InviterInput, token) =>
    apiFetch<UtilisateurBackOffice>('/admin/entreprise/utilisateurs', { method: 'POST', body: dto, token }),
  );
}

export function useModifierUtilisateur() {
  return useMutationUtilisateur(
    ({ id, dto }: { id: string; dto: { role?: RoleAttribuable; statut?: 'actif' | 'suspendu' } }, token) =>
      apiFetch<UtilisateurBackOffice>(`/admin/entreprise/utilisateurs/${id}`, { method: 'PATCH', body: dto, token }),
  );
}

export function useJournal(action: string) {
  const token = useAuthStore((state) => state.token);
  return useInfiniteQuery({
    queryKey: ['entreprise-journal', action],
    queryFn: ({ pageParam }) =>
      apiFetch<PageJournal>('/admin/entreprise/journal', {
        token,
        query: { action: action || undefined, avant: pageParam ?? undefined },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.suivant,
    enabled: Boolean(token),
  });
}

export function useClients(recherche: string, page: number) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['entreprise-clients', recherche, page],
    queryFn: () =>
      apiFetch<PageClients>('/admin/entreprise/clients', {
        token,
        query: { recherche: recherche || undefined, page },
      }),
    enabled: Boolean(token),
    placeholderData: (precedent) => precedent,
  });
}
