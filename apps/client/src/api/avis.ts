import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { apiFetch } from './client';

export interface AvisEnregistre {
  note: number;
  commentaire: string | null;
  createdAt: string;
}

export interface CibleAvis {
  cibleId: string;
  nom: string;
  autorise: boolean;
  avis: AvisEnregistre | null;
}

export interface AvisCommande {
  partenaire: CibleAvis | null;
  livreur: CibleAvis | null;
}

export function useAvisCommande(commandeId: string | undefined, prestationTerminee: boolean) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['avis-commande', commandeId],
    queryFn: () => apiFetch<AvisCommande>(`/commandes/${commandeId}/avis`, { token }),
    enabled: Boolean(commandeId && token && prestationTerminee),
    refetchInterval: (query) => {
      const data = query.state.data as AvisCommande | undefined;
      return data?.partenaire?.autorise || data?.livreur?.autorise ? false : 30_000;
    },
  });
}

export function useCreerAvis(commandeId: string) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { cible: 'partenaire' | 'livreur'; note: number; commentaire?: string }) =>
      apiFetch(`/commandes/${commandeId}/avis`, { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avis-commande', commandeId] }),
  });
}
