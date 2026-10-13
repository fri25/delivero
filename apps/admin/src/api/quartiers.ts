import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Quartier } from './types';

interface QuartierUpdate {
  nom?: string;
  fraisLivraison?: number;
  actif?: boolean;
}

/** Every neighbourhood, active or not (back-office list). */
export function useQuartiers() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-quartiers'],
    queryFn: () => apiFetch<Quartier[]>('/admin/quartiers', { token }),
    enabled: Boolean(token),
  });
}

export function useCreerQuartier() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { nom: string; fraisLivraison: number }) =>
      apiFetch<Quartier>('/admin/quartiers', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-quartiers'] }),
  });
}

export function useModifierQuartier() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: QuartierUpdate }) =>
      apiFetch<Quartier>(`/admin/quartiers/${id}`, { method: 'PATCH', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-quartiers'] }),
  });
}
