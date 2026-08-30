import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { RestaurantDetail, RestaurantListItem } from './types';

// Endpoint public (@Public côté API, voir apps/api/src/restaurants) : pas
// besoin de jeton, réutilisé tel quel pour la saisie manuelle (F-ADM-04).
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants-catalogue'],
    queryFn: () => apiFetch<RestaurantListItem[]>('/restaurants'),
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-catalogue', id],
    queryFn: () => apiFetch<RestaurantDetail>(`/restaurants/${id}`),
    enabled: Boolean(id),
  });
}
