import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { RestaurantDetail, RestaurantSummary } from './types';

export function useRestaurants(search?: string) {
  return useQuery({
    queryKey: ['restaurants', search ?? ''],
    queryFn: () =>
      apiFetch<RestaurantSummary[]>(`/restaurants${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => apiFetch<RestaurantDetail>(`/restaurants/${id}`),
    enabled: Boolean(id),
  });
}
