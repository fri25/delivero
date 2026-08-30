import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { AdminCommandeRow, AdminCommandesPage, TypeService } from './types';

// F-ADM-01 : vue d'ensemble, tous services. Pas de temps réel ici pour
// l'instant (voir apps/api/src/realtime/) : rafraîchi manuellement /
// périodiquement, un dispatcher garde l'onglet ouvert en continu.
const POLL_INTERVAL_MS = 10000;

interface UseCommandesOverviewParams {
  typeService?: TypeService;
  page: number;
  pageSize: number;
}

export function useCommandesOverview({ typeService, page, pageSize }: UseCommandesOverviewParams) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-commandes', typeService, page, pageSize],
    queryFn: () =>
      apiFetch<AdminCommandesPage>('/admin/commandes', {
        token,
        query: { typeService, page, pageSize },
      }),
    enabled: Boolean(token),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useAttribuerCommande() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, livreurId }: { id: string; livreurId?: string }) =>
      apiFetch<AdminCommandeRow>(`/admin/commandes/${id}/attribuer`, {
        method: 'PATCH',
        body: { livreurId },
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-commandes'] }),
  });
}
