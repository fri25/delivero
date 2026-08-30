import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { ClotureCaisse, Livreur, PortefeuilleResume } from './types';

export function useMoi() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mon-profil-livreur'],
    queryFn: () => apiFetch<Livreur>('/livreurs/me', { token }),
    enabled: Boolean(token),
  });
}

export function usePortefeuille() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mon-portefeuille-livreur'],
    queryFn: () => apiFetch<PortefeuilleResume>('/livreurs/me/portefeuille', { token }),
    enabled: Boolean(token),
  });
}

export function useClotures() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-clotures-caisse'],
    queryFn: () => apiFetch<ClotureCaisse[]>('/livreurs/me/clotures-caisse', { token }),
    enabled: Boolean(token),
  });
}

export function useCloturerCaisse() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (montantDeclare: number) =>
      apiFetch<ClotureCaisse>('/livreurs/me/cloture-caisse', {
        method: 'POST',
        body: { montantDeclare },
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-clotures-caisse'] });
      queryClient.invalidateQueries({ queryKey: ['mon-portefeuille-livreur'] });
    },
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
