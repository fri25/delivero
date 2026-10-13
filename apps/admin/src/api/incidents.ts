import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Remboursement, Remboursements, TypeService } from './types';

// F-ADM-06 — cancellation by the dispatcher and manual refunds.

/**
 * Statuses from which the dispatcher may still cancel (decision of 13/10):
 * before the kitchen starts for Repas, before a livreur starts for the
 * others. Mirrors STATUTS_ANNULABLES in apps/api/src/admin/admin-incidents.service.ts.
 */
export const STATUTS_ANNULABLES: Record<TypeService, string[]> = {
  repas: ['en_attente_acceptation', 'confirmee'],
  colis: ['confirmee'],
  courses_express: ['confirmee'],
  emplettes: ['confirmee'],
};

export function useAnnulerCommande() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      apiFetch<{ id: string }>(`/admin/commandes/${id}/annuler`, { method: 'PATCH', body: { motif }, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-commandes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-remboursements'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-statistiques'] });
    },
  });
}

export function useRemboursements() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-remboursements'],
    queryFn: () => apiFetch<Remboursements>('/admin/remboursements', { token }),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export interface RembourserInput {
  id: string;
  montantRembourse: number;
  reference?: string;
  motif?: string;
}

export function useRembourser() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: RembourserInput) =>
      apiFetch<Remboursement>(`/admin/remboursements/${id}`, { method: 'PATCH', body, token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-remboursements'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-statistiques'] });
    },
  });
}
