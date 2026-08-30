import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Zone } from './types';

interface ZoneInput {
  nom: string;
  description?: string;
  fraisLivraison: number;
  tarifBaseColis: number;
  tarifBaseCoursesExpress: number;
}

type ZoneUpdateInput = Partial<Omit<ZoneInput, 'nom'>>;

export function useZones() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-zones'],
    queryFn: () => apiFetch<Zone[]>('/admin/zones', { token }),
    enabled: Boolean(token),
  });
}

export function useCreateZone() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ZoneInput) =>
      apiFetch<Zone>('/admin/zones', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-zones'] }),
  });
}

export function useUpdateZone() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ZoneUpdateInput }) =>
      apiFetch<Zone>(`/admin/zones/${id}`, { method: 'PATCH', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-zones'] }),
  });
}
