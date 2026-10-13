import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from './client';
import type { EtatPaiement } from './paiements';
import type { NoteInput } from './notations';
import type {
  CommandeColis,
  CommandeCoursesExpress,
  CommandeRepas,
  ModePaiement,
  NotationResume,
  TailleColis,
} from './types';
import { memoriserCommandeInvite } from '../lib/commandes-invite';
import { doitEtrePaye } from '../lib/paiement';

// F-CLI-02 : commande sans compte. Every call after creation goes through the
// signed tracking link (`jeton`), never through a session.

export interface ContactInvite {
  nom: string;
  telephone: string;
}

export interface AdresseInvite {
  /** Priced neighbourhood (mandatory, Q-28). */
  quartierId: string;
  /** Name typed for "Autre quartier". */
  quartier?: string;
  pointDeRepere: string;
  latitude?: number;
  longitude?: number;
}

export type TypeServiceInvite = 'repas' | 'colis' | 'courses_express';

export interface CommandeInviteCreee {
  jeton: string;
  typeService: TypeServiceInvite;
  commandeId: string;
  commandeServiceId: string;
}

export type SuiviInvite =
  | { typeService: 'repas'; commandeServiceId: string; commande: CommandeRepas }
  | { typeService: 'colis'; commandeServiceId: string; commande: CommandeColis }
  | { typeService: 'courses_express'; commandeServiceId: string; commande: CommandeCoursesExpress };

export interface CommandeRepasInviteInput {
  invite: ContactInvite;
  adresse: AdresseInvite;
  partenaireId: string;
  modePaiement: ModePaiement;
  lignes: { platId: string; quantite: number; instructions?: string }[];
}

export interface CommandeColisInviteInput {
  invite: ContactInvite;
  adresseEnlevement: AdresseInvite;
  zoneId: string;
  taille: TailleColis;
  destinataireNom: string;
  destinataireTelephone: string;
  quartierLivraisonId: string;
  quartierLivraison?: string;
  adresseLivraison?: string;
  pointDeRepereLivraison: string;
  valeurDeclaree?: number;
  fragile?: boolean;
  photoUrl?: string;
  modePaiement: ModePaiement;
  conditionsAcceptees: boolean;
  programmationAt?: string;
}

export interface CommandeCoursesExpressInviteInput {
  invite: ContactInvite;
  description: string;
  zoneId: string;
  modePaiement: ModePaiement;
  photoUrls?: string[];
  etapes: { description: string; pointDeRepere: string; adresse?: string; quartierId: string; quartier?: string }[];
}

const CHEMINS_CREATION: Record<TypeServiceInvite, string> = {
  repas: 'repas',
  colis: 'colis',
  courses_express: 'courses-express',
};

export function useCreerCommandeInvite<TInput>(typeService: TypeServiceInvite) {
  return useMutation({
    mutationFn: (dto: TInput) =>
      apiFetch<CommandeInviteCreee>(`/invite/commandes/${CHEMINS_CREATION[typeService]}`, {
        method: 'POST',
        body: dto,
      }),
    onSuccess: (creee) => memoriserCommandeInvite(creee.jeton, creee.typeService),
  });
}

const TERMINAUX = ['livree', 'livre', 'terminee', 'annulee', 'refusee', 'litige'];

export function useSuiviInvite(jeton: string | undefined) {
  return useQuery({
    queryKey: ['suivi-invite', jeton],
    queryFn: () => apiFetch<SuiviInvite>(`/invite/suivi/${jeton}`),
    enabled: Boolean(jeton),
    // No WebSocket for guests: poll while the order is in progress.
    refetchInterval: (query) => {
      const statut = query.state.data?.commande.statut;
      return statut && TERMINAUX.includes(statut) ? false : 10_000;
    },
    retry: (echecs, error) => (error as { statusCode?: number }).statusCode !== 404 && echecs < 3,
  });
}

function useActionInvite<TResult, TVariables = void>(
  jeton: string | undefined,
  requete: (jeton: string, variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => requete(jeton!, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suivi-invite', jeton] }),
  });
}

export function usePayerInvite(jeton: string | undefined) {
  return useActionInvite(jeton, (j) =>
    apiFetch<EtatPaiement & { url: string | null }>(`/invite/suivi/${j}/paiement/initier`, { method: 'POST' }).then(
      (etat) => {
        if (etat.url) window.location.assign(etat.url);
        return etat;
      },
    ),
  );
}

export function useSynchroniserPaiementInvite(jeton: string | undefined) {
  return useActionInvite(jeton, (j) =>
    apiFetch<EtatPaiement>(`/invite/suivi/${j}/paiement/synchroniser`, { method: 'POST' }),
  );
}

export function useAnnulerInvite(jeton: string | undefined) {
  return useActionInvite(jeton, (j) => apiFetch<unknown>(`/invite/suivi/${j}/annuler`, { method: 'PATCH' }));
}

export function useNoterInvite(jeton: string | undefined) {
  return useActionInvite(jeton, (j, notes: NoteInput[]) =>
    apiFetch<NotationResume[]>(`/invite/suivi/${j}/notations`, { method: 'POST', body: { notes } }),
  );
}

/**
 * Right after a guest order: chain to the FedaPay page, like a signed-in
 * client; if it cannot open, land on the tracking page (retry from there).
 */
export function useApresCreationInvite() {
  const navigate = useNavigate();
  return async (creee: CommandeInviteCreee, paiement: { mode: ModePaiement; statut: 'en_attente' } | null) => {
    const suivi = `/suivi/${creee.jeton}`;
    if (!doitEtrePaye(paiement)) {
      toast.success('Commande enregistrée. Le lien de suivi vous a été envoyé par WhatsApp/SMS.');
      navigate(suivi);
      return;
    }
    try {
      const etat = await apiFetch<EtatPaiement & { url: string | null }>(
        `/invite/suivi/${creee.jeton}/paiement/initier`,
        { method: 'POST' },
      );
      if (etat.url) {
        window.location.assign(etat.url);
        return;
      }
      navigate(suivi);
    } catch (error) {
      toast.error(`Commande enregistrée, mais le paiement n’a pas pu s’ouvrir : ${(error as Error).message}`);
      navigate(suivi);
    }
  };
}
