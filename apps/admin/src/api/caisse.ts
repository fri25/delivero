import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { ClotureCaisse } from './types';

export function useClotures() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-clotures-caisse'],
    queryFn: () => apiFetch<ClotureCaisse[]>('/admin/caisse/clotures', { token }),
    enabled: Boolean(token),
  });
}

export function useRapprocherCloture() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ClotureCaisse>(`/admin/caisse/clotures/${id}/rapprocher`, {
        method: 'PATCH',
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-clotures-caisse'] }),
  });
}
