import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Livreur } from './types';

export function useMoi() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mon-profil-livreur'],
    queryFn: () => apiFetch<Livreur>('/livreurs/me', { token }),
    enabled: Boolean(token),
  });
}

export function useToggleDisponibilite() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (disponible: boolean) =>
      apiFetch<Livreur>('/livreurs/me/disponibilite', {
        method: 'PATCH',
        body: { disponible },
        token,
      }),
    onSuccess: (data) => queryClient.setQueryData(['mon-profil-livreur'], data),
  });
}
