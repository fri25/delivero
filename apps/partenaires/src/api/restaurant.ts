import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '../stores/auth-store';
import type { Plat, Restaurant } from './types';

interface UpdateRestaurantInput {
  nom?: string;
  description?: string;
  horaires?: string;
}

interface CreatePlatInput {
  nom: string;
  categorie?: string;
  description?: string;
  prix: number;
  disponible?: boolean;
}

type UpdatePlatInput = Partial<CreatePlatInput>;

export function useMonRestaurant() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mon-restaurant'],
    queryFn: () => apiFetch<Restaurant>('/restaurants/me', { token }),
    enabled: Boolean(token),
  });
}

export function useUpdateMonRestaurant() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateRestaurantInput) =>
      apiFetch<Restaurant>('/restaurants/me', { method: 'PATCH', body: dto, token }),
    onSuccess: (data) => queryClient.setQueryData(['mon-restaurant'], data),
  });
}

export function useToggleOuverture() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statutOuverture: boolean) =>
      apiFetch<Restaurant>('/restaurants/me/statut-ouverture', {
        method: 'PATCH',
        body: { statutOuverture },
        token,
      }),
    onSuccess: (data) => queryClient.setQueryData(['mon-restaurant'], data),
  });
}

export function useMesPlats() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ['mes-plats'],
    queryFn: () => apiFetch<Plat[]>('/restaurants/me/plats', { token }),
    enabled: Boolean(token),
  });
}

export function useCreatePlat() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlatInput) =>
      apiFetch<Plat>('/restaurants/me/plats', { method: 'POST', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-plats'] }),
  });
}

export function useUpdatePlat() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlatInput }) =>
      apiFetch<Plat>(`/restaurants/me/plats/${id}`, { method: 'PATCH', body: dto, token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-plats'] }),
  });
}

export function useTogglePlatDisponibilite() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, disponible }: { id: string; disponible: boolean }) =>
      apiFetch<Plat>(`/restaurants/me/plats/${id}/disponibilite`, {
        method: 'PATCH',
        body: { disponible },
        token,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-plats'] }),
  });
}

export function useRemovePlat() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/restaurants/me/plats/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mes-plats'] }),
  });
}
