import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Livreur } from './types';

interface CreateLivreurInput {
  telephone: string;
  motDePasse: string;
  nom: string;
  zoneId: string;
  plafondAvance: number;
  plafondCaisse: number;
}

interface UpdateLivreurInput {
  zoneId?: string;
  plafondAvance?: number;
  plafondCaisse?: number;
}

export function useLivreurs() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['admin-livreurs'],
    queryFn: () => apiFetch<Livreur[]>('/admin/livreurs', { token }),
    enabled: Boolean(token),
  });
}

export function useCreateLivreur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLivreurInput) =>
      apiFetch<Livreur>('/admin/livreurs', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] }),
  });
}

export function useUpdateLivreur() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLivreurInput }) =>
      apiFetch<Livreur>(`/admin/livreurs/${id}`, { method: 'PATCH', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] }),
  });
}
